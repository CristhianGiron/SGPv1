/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AuthSessionService.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Implementa la lógica de aplicación de la autenticación de usuarios.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.AuthSession;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.AuthSessionRepository;
import com.sgp.systemsgp.config.JwtService;
import com.sgp.systemsgp.dto.auth.AuthResponse;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class AuthSessionService {
 private final AuthSessionRepository sessions;
 private final AccountRepository accounts;
 private final JwtService jwt;
 private BadCredentialsException invalid(){return new BadCredentialsException("Sesión inválida o expirada");}
 private Account owner(String username){return accounts.lockForSecurityUpdate(username).orElseThrow(this::invalid);}
 private void requireEnabled(Account account){if(account.isDeleted()||!account.isEnabled()||account.isLocked())throw invalid();}
 private String hash(String token){
  try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));}
  catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}
 }
 private AuthResponse tokens(Account account,AuthSession session){
  var user=User.withUsername(account.getUsername()).password(account.getPassword())
    .authorities(account.getRoles().stream().map(Role::getName).toArray(String[]::new)).build();
  String access=jwt.generateSessionToken(user,session.getId(),account.getAuthVersion(),false);
  String refresh=jwt.generateSessionToken(user,session.getId(),account.getAuthVersion(),true);
  session.setRefreshHash(hash(refresh));
  return AuthResponse.builder().accessToken(access).refreshToken(refresh).username(account.getUsername())
    .passwordChangeRequired(account.isPasswordChangeRequired()).build();
 }
 @Transactional public AuthResponse create(String username){
  var account=owner(username);requireEnabled(account);
  var session=AuthSession.builder().id(UUID.randomUUID().toString()).account(account).createdAt(Instant.now()).build();
  var response=tokens(account,session);session.setExpiresAt(jwt.extractClaims(response.getRefreshToken()).getExpiration().toInstant());
  sessions.save(session);return response;
 }
 @Transactional public AuthResponse refresh(String token){
  io.jsonwebtoken.Claims claims;
  try{claims=jwt.extractClaims(token);}catch(io.jsonwebtoken.JwtException|IllegalArgumentException e){throw invalid();}
  if(!"refresh".equals(claims.get("tokenUse",String.class)))throw invalid();
  var account=owner(claims.getSubject());requireEnabled(account);
  String sid=claims.get("sid",String.class);if(sid==null)throw invalid();
  var session=sessions.findForUpdate(sid).orElseThrow(this::invalid);
  Number ver=claims.get("ver",Number.class);
  if(ver==null||ver.longValue()!=account.getAuthVersion()||!session.getAccount().getId().equals(account.getId())
      ||session.getRevokedAt()!=null||!session.getExpiresAt().isAfter(Instant.now())
      ||!MessageDigest.isEqual(hash(token).getBytes(StandardCharsets.US_ASCII),session.getRefreshHash().getBytes(StandardCharsets.US_ASCII)))throw invalid();
  var response=tokens(account,session);sessions.save(session);return response;
 }
 public boolean isAccessAllowed(String token,Account account){
  if(account==null||account.isDeleted()||!account.isEnabled()||account.isLocked())return false;
  var claims=jwt.extractClaims(token);Number ver=claims.get("ver",Number.class);
  if((ver==null?0L:ver.longValue())!=account.getAuthVersion())return false;
  String sid=claims.get("sid",String.class);
  // Legacy access tokens remain compatible until an explicit all-session revocation/password change.
  if(sid==null)return ver==null;
  return sessions.findById(sid).filter(s->s.getAccount().getId().equals(account.getId())&&s.getRevokedAt()==null&&s.getExpiresAt().isAfter(Instant.now())).isPresent();
 }
 public boolean isAccessAllowed(String token){
  try {
   var claims=jwt.extractClaims(token);
   if(!"access".equals(claims.get("tokenUse",String.class))&&!(claims.get("tokenUse")==null&&claims.get("roles") instanceof List<?>))return false;
   return accounts.findByUsernameAndDeletedFalse(claims.getSubject()).filter(a->isAccessAllowed(token,a)).isPresent();
  }catch(io.jsonwebtoken.JwtException|IllegalArgumentException e){return false;}
 }
 @Transactional public void logout(String username,String accessToken,boolean all){
  var account=owner(username);var claims=jwt.extractClaims(accessToken);
  if(!account.getUsername().equals(claims.getSubject())||!isAccessAllowed(accessToken,account))throw invalid();
  String sid=claims.get("sid",String.class);
  if(all||sid==null){
   account.setAuthVersion(account.getAuthVersion()+1);accounts.save(account);
   for(var session:sessions.findByAccount_IdAndRevokedAtIsNull(account.getId())){session.setRevokedAt(Instant.now());sessions.save(session);}
  }else{
   var session=sessions.findForUpdate(sid).orElseThrow(this::invalid);
   if(!session.getAccount().getId().equals(account.getId()))throw invalid();
   session.setRevokedAt(Instant.now());sessions.save(session);
  }
 }
}
