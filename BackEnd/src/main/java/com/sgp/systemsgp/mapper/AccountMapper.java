package com.sgp.systemsgp.mapper;

import com.sgp.systemsgp.dto.account.AccountResponse;

import com.sgp.systemsgp.model.Account;

import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class AccountMapper {

        public AccountResponse toResponse(Account account) {

                return AccountResponse.builder()

                                .id(account.getId())

                                .username(account.getUsername())

                                .names(account.getPerson().getNames())

                                .lastNames(account.getPerson().getLastNames())

                                .institutionalEmail(
                                                account.getPerson()
                                                                .getInstitutionalEmail())

                                .institutionId(
                                                account.getInstitution() != null
                                                                ? account.getInstitution().getId()
                                                                : null)

                                .institution(
                                                account.getInstitution() != null
                                                                ? account.getInstitution().getName()
                                                                : null)

                                .roles(
                                                account.getRoles()
                                                                .stream()
                                                                .map(role -> role.getName())
                                                                .collect(Collectors.toSet()))

                                .build();
        }
}
