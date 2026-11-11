/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DataInspector.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Data Inspector mediante pruebas de regresión.
 */

import { render, screen } from '@testing-library/react';
import { DataInspector } from './DataInspector';
import { formatValue } from '../utils/format';

test('schedule detail translates nested attendance headings and weekday values without changing source data', () => {
  const data = {
    periods: [{ startTime:'08:00:00', endTime:'10:00:00', totalTime:'2h 0min', dayOfWeek:'MONDAY', totalMinutes:120, place:'Laboratorio' }],
    attendances: [{ startTime:'08:15:00', endTime:'10:00:00', totalTime:'1h 45min', scheduledDayOfWeek:'WEDNESDAY', scheduledStartTime:'08:00:00', scheduledEndTime:'10:00:00' }],
  };
  render(<DataInspector data={data} moduleId="practice-schedules" />);
  expect(screen.getByRole('heading', { name:'Períodos programados' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name:'Asistencias' })).toBeInTheDocument();
  expect(screen.getAllByRole('columnheader', { name:'Tiempo total' })).toHaveLength(2);
  for (const name of ['Día programado','Hora de inicio programada','Hora de finalización programada']) {
    expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
  }
  expect(screen.getByText('Lunes')).toBeInTheDocument();
  expect(screen.getByText('Miércoles')).toBeInTheDocument();
  expect(screen.queryByText(/Attendances|Total Time|Scheduled Day Of Week|MONDAY|WEDNESDAY/)).not.toBeInTheDocument();
  expect(data.periods[0].dayOfWeek).toBe('MONDAY');
  expect(formatValue('MONDAY', 'notes')).toBe('MONDAY');
});
