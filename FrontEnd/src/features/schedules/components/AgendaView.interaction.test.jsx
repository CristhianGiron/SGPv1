/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AgendaView.interaction.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Agenda View.interaction mediante pruebas de regresión.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { AgendaView, upcomingJornadas } from './AgendaView';
const schedules=[{id:1,courseName:'Informática',studentFullName:'Ana Torres',periods:[{id:1,dayOfWeek:'MONDAY',startTime:'08:00:00',endTime:'12:00:00',place:'Laboratorio'}],attendances:[{id:1,schedulePeriodId:1,attendanceDate:'2026-10-26',status:'PRESENT'}]}, {id:2,courseName:'Informática',studentFullName:'Luis Vega',periods:[{id:2,dayOfWeek:'MONDAY',startTime:'14:00:00',endTime:'16:00:00'}]}];
beforeEach(()=>{jest.useFakeTimers();jest.setSystemTime(new Date(2026,9,26,13));});
afterEach(()=>jest.useRealTimers());
test('weekly and list presentations keep filters and real attendance states',()=>{
 render(<AgendaView schedules={schedules}/>);expect(screen.getByText('Presente')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Lista'}));expect(screen.getByRole('button',{name:'Lista'})).toHaveAttribute('aria-pressed','true');
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Luis'}});expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument();expect(screen.getByText('Luis Vega')).toBeInTheDocument();
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Nadie'}});expect(screen.getByText('No hay jornadas que coincidan')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Limpiar búsqueda'}));expect(screen.getByText('Ana Torres')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Semana siguiente'}));expect(screen.getByText('2 jornada(s) esta semana · 0 con asistencia registrada')).toBeInTheDocument();
});
test('upcoming journeys exclude periods already finished today',()=>{
 const upcoming=upcomingJornadas(schedules,new Date(2026,9,26,13));expect(upcoming[0].entries.map(entry=>entry.studentName)).toEqual(['Luis Vega']);
});
