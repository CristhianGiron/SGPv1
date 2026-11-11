/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          RegisterStudentPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Register Student Page mediante pruebas de regresión.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegisterStudentPage } from './RegisterStudentPage';
import { InstitutionalProvider } from '../../../contexts/InstitutionalContext';
import { apiRequest } from '../../../api/client';
import { setHashRoute } from '../../../utils/routes';
const mockRegisterStudent = jest.fn();

jest.mock('../../../api/client', () => ({ apiRequest: jest.fn(), unwrapPage: (value) => value?.content || value || [] }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ registerStudent: mockRegisterStudent }) }));
jest.mock('../../../utils/routes', () => ({ setHashRoute: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  mockRegisterStudent.mockResolvedValue({ accessToken: 'fixture' });
  apiRequest.mockImplementation(async (path) => path.endsWith('institutional-defaults') ? {
    universityId: 1, universityName: 'Universidad Nacional de Loja', facultyId: 10, careerId: 100,
  } : [
    { id: 1000, name: 'Primero', institutionId: 1, institution: 'Universidad Nacional de Loja', facultyId: 10, faculty: 'Educación', careerId: 100, career: 'Informática' },
    { id: 2000, name: 'Segundo', institutionId: 2, institution: 'Otra universidad', facultyId: 20, faculty: 'Otra facultad', careerId: 200, career: 'Otra carrera' },
  ]);
});

function renderRegistration() {
  render(<InstitutionalProvider><RegisterStudentPage /></InstitutionalProvider>);
}
function personal() {
  for (const [label, value] of Object.entries({Nombres:'María',Apellidos:'Muñoz','Cédula':'1100000001'}))
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function credentials() {
  for (const [label, value] of Object.entries({'Correo institucional':'maria@unl.edu.ec',Usuario:'maria.fixture','Contraseña':'ClaveFixture!2026'}))
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function submit() { fireEvent.submit(screen.getByRole('form', { name: 'Registro de estudiante' })); }
function reachAcademicStep() { personal(); submit(); credentials(); submit(); }

it('preselecciona la carrera configurada y permite cambiar de universidad sin ofrecer roles de personal', async () => {
  renderRegistration();
  reachAcademicStep();
  await waitFor(() => expect(screen.getByLabelText('Carrera')).toHaveValue('100'));
  expect(screen.getByLabelText('Universidad')).toHaveValue('1');
  expect(screen.queryByRole('tab', { name: /tutor/i })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Universidad'), { target: { value: '2' } });
  expect(screen.getByLabelText('Facultad')).toHaveValue('');
  expect(screen.getByLabelText('Carrera')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Facultad'), { target: { value: '20' } });
  fireEvent.change(screen.getByLabelText('Carrera'), { target: { value: '200' } });
  expect(screen.getByLabelText('Carrera')).toHaveValue('200');
  expect(screen.getByRole('option', { name: /Segundo/ })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /Primero/ })).not.toBeInTheDocument();
});


test('validates the current step, keeps entered data and exposes only one panel', async () => {
  renderRegistration();
  await waitFor(() => expect(screen.getByLabelText('Carrera')).toHaveValue('100'));
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  expect(screen.getByRole('tab', {name:/Cuenta/})).toBeDisabled();
  expect(screen.queryByRole('button', {name:'Crear cuenta'})).not.toBeInTheDocument();
  submit();
  expect(screen.getByRole('status')).toHaveTextContent('Paso 1 de 3');
  personal(); submit();
  expect(screen.getByRole('status')).toHaveTextContent('Paso 2 de 3');
  credentials();
  fireEvent.change(screen.getByLabelText('Correo institucional'), {target:{value:'correo-inválido'}});
  submit();
  expect(screen.getByRole('status')).toHaveTextContent('Paso 2 de 3');
  expect(mockRegisterStudent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', {name:'Anterior'}));
  expect(screen.getByLabelText('Nombres')).toHaveValue('María');
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
});

test('creates an account only in the last step and preserves the existing payload contract', async () => {
  let finish;
  mockRegisterStudent.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  renderRegistration(); reachAcademicStep();
  await waitFor(() => expect(screen.getByLabelText('Carrera')).toHaveValue('100'));
  submit();
  expect(mockRegisterStudent).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Ciclo académico'), {target:{value:'1000'}});
  fireEvent.click(screen.getByRole('button', {name:'Anterior'}));
  expect(screen.getByLabelText('Contraseña')).toHaveValue('ClaveFixture!2026');
  submit(); submit(); submit();
  expect(mockRegisterStudent).toHaveBeenCalledTimes(1);
  expect(mockRegisterStudent).toHaveBeenCalledWith({file:null, data:expect.objectContaining({
    role:'ROLE_ESTUDIANTE', names:'María', lastNames:'Muñoz', username:'maria.fixture',
    password:'ClaveFixture!2026', institutionalEmail:'maria@unl.edu.ec', academicCycleId:1000,
  })});
  expect(screen.getByRole('button', {name:/Registrando/})).toBeDisabled();
  await act(async () => finish({accessToken:'fixture'}));
  expect(setHashRoute).toHaveBeenCalledWith('dashboard');
});

test('rechecks earlier steps before accepting a final submission', async () => {
  renderRegistration(); reachAcademicStep();
  await waitFor(() => expect(screen.getByLabelText('Carrera')).toHaveValue('100'));
  fireEvent.change(screen.getByLabelText('Ciclo académico'), {target:{value:'1000'}});
  fireEvent.change(screen.getByLabelText('Nombres'), {target:{value:''}});
  submit();
  expect(screen.getByRole('status')).toHaveTextContent('Paso 1 de 3');
  expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/Datos personales/);
  expect(mockRegisterStudent).not.toHaveBeenCalled();
});
