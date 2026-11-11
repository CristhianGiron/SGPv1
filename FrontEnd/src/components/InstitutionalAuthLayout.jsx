/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalAuthLayout.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente InstitutionalAuthLayout de la interfaz del SGP.
 */

import { useInstitutionalContext } from '../contexts/InstitutionalContext';
import { PageInfoButton } from './ui/PageHeader';
import { ThemeToggle } from './ui/ThemeToggle';
import campusImage from '../assets/branding/unl-campus.jpg';
import universityLogo from '../assets/branding/unl-logo.png';
import '../pages/LoginPage.css';

export function InstitutionalAuthLayout({ children, className = '', titleId, skipTarget, skipLabel,
  helpTitle, helpDescription, serviceName = <>Acceso al sistema<br />de prácticas</>,
  supportText = 'Si necesitas recuperar el acceso, solicita ayuda a la administración del sistema.' }) {
  const institution = useInstitutionalContext();
  const isUnl = institution.universityCode?.toUpperCase() === 'UNL';
  return <div className={`login-page institutional-login ${className}`} style={isUnl ? {'--login-campus-image':`url(${campusImage})`} : undefined}>
    <a className="login-skip-link" href={`#${skipTarget}`} onClick={event => {
      event.preventDefault();
      const target = document.getElementById(skipTarget);
      target?.focus();
      target?.scrollIntoView?.({ block: 'nearest' });
    }}>{skipLabel}</a>
    <header className="login-header">
      <div className="login-header-inner">
        <div className="login-institution" aria-label={institution.universityName}>
          {isUnl ? <div className="login-logo">
            <img src={universityLogo} alt={`Logo de ${institution.universityName}`} width="300" height="168" />
            <img src={universityLogo} alt="" aria-hidden="true" className="login-logo-light-ink" width="300" height="168" />
          </div> : <><span className="login-wordmark" aria-hidden="true">{institution.universityCode}</span><span className="login-university-name">{institution.universityName}</span></>}
        </div>
        <p className="login-service-name">{serviceName}</p>
      </div>
      <p className="login-system-name">Sistema de Gestión de Prácticas · SGP</p>
    </header>

    <main className="login-main" aria-labelledby={titleId}>{children}</main>
    <section className="login-support" aria-labelledby="login-support-title">
      <div className="login-support-heading">
        <h2 id="login-support-title">Recursos de apoyo</h2>
        <div className="login-header-tools">
          <PageInfoButton title={helpTitle} description={helpDescription} />
          <ThemeToggle />
        </div>
      </div>
      <p>{supportText}</p>
      <p className="login-academic-context">{institution.facultyName} · {institution.careerName}</p>
    </section>
    <footer className="login-footer">
      <span>{institution.universityName}</span>
      <span>Gestión de prácticas preprofesionales</span>
    </footer>
  </div>;
}
