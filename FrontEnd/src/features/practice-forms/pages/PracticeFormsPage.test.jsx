/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormsPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los instrumentos de entrevista y observación mediante pruebas de regresión.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { Tabulation } from './PracticeFormsPage';

test('numeric aggregates preserve zero instead of displaying a missing-value dash',()=>{
 render(<Tabulation question={{type:'NUMBER',tabulation:{counts:{},numericCount:1,numericAverage:0,numericMin:0,numericMax:0}}}/>);
 expect(screen.getAllByText('0')).toHaveLength(3);
 expect(screen.queryByText('-')).not.toBeInTheDocument();
});

test('empty distributions never display invalid percentages',()=>{
 const {container}=render(<Tabulation question={{type:'YES_NO',tabulation:{counts:{Sí:0,No:0},numericCount:0}}}/>);
 expect(container).not.toHaveTextContent('NaN');
 expect(container).not.toHaveTextContent('Infinity');
 expect(screen.getAllByText(/\(0.0%\)/)).toHaveLength(2);
});

test('quantitative questions allow switching between bars and pie without changing their frequencies', () => {
 render(<Tabulation question={{id:7,order:2,type:'MULTIPLE_CHOICE',tabulation:{counts:{Laboratorio:2,Proyector:1},numericCount:0}}}/>);
 expect(screen.getByRole('img', {name:/Gráfico de barras/})).toBeInTheDocument();
 expect(screen.getByText(/porcentajes se calculan sobre el total de selecciones/)).toBeInTheDocument();
 expect(screen.getByText('66.7%')).toBeInTheDocument();
 expect(screen.getByText('33.3%')).toBeInTheDocument();
 fireEvent.change(screen.getByRole('combobox', {name:'Tipo de gráfico de la pregunta 2'}), {target:{value:'pie'}});
 expect(screen.getByRole('img', {name:/Gráfico circular.*3 selecciones/})).toBeInTheDocument();
 expect(screen.getByText('66.7%')).toBeInTheDocument();
});

test('numeric charts order negative and zero values numerically', () => {
 render(<Tabulation question={{type:'NUMBER',tabulation:{counts:{10:1,0:1,'-2':1},numericCount:3,numericAverage:2.67,numericMin:-2,numericMax:10}}}/>);
 const rows = screen.getAllByRole('row');
 expect(rows.slice(1).map(row => row.cells[0].textContent)).toEqual(['-2','0','10']);
 expect(screen.getByRole('img', {name:/Gráfico de barras/})).toBeInTheDocument();
});
