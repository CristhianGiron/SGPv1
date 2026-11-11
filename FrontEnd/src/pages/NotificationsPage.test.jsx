/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationsPage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las notificaciones mediante pruebas de regresión.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NotificationsPage } from './NotificationsPage';
import { useNotifications } from '../hooks/useNotifications';
import { openNotificationLink } from '../utils/notificationLinks';
let mockRoles=['ROLE_ESTUDIANTE'];
const mockConfirm=jest.fn().mockResolvedValue(true);
jest.mock('../api/client',()=>({apiRequest:jest.fn(async()=>[]),apiUrl:value=>value}));
jest.mock('../auth/AuthContext',()=>({useAuth:()=>({token:'fixture',roles:mockRoles})}));
jest.mock('../hooks/useNotifications',()=>({useNotifications:jest.fn()}));
jest.mock('../utils/notificationLinks',()=>({hasNotificationLink:value=>Boolean(value),openNotificationLink:jest.fn()}));
jest.mock('../components/ui/ConfirmDialog',()=>({useConfirm:()=>mockConfirm}));
const markAsRead=jest.fn(),markAllAsRead=jest.fn(),refresh=jest.fn();
const items=[{id:1,title:'Plan aprobado',message:'Revisión del tutor',createdAt:'2026-11-01T10:00:00',read:false,link:'#/practices/7'}, {id:2,title:'Aviso anterior',message:'Información académica',createdAt:'2026-10-31T10:00:00',read:true}, {id:3,title:'Jornada programada',message:'Laboratorio de informática',read:false}];
beforeEach(()=>{
 mockRoles=['ROLE_ESTUDIANTE'];jest.clearAllMocks();markAsRead.mockResolvedValue({read:true});markAllAsRead.mockResolvedValue();mockConfirm.mockResolvedValue(true);
 useNotifications.mockReturnValue({notifications:items,unreadCount:2,loading:false,error:'',markAsRead,markAllAsRead,refresh});
});
test('inbox separates read and unread messages and searches without accents',()=>{
 render(<NotificationsPage/>);
 expect(screen.getByText('Plan aprobado')).toBeInTheDocument();expect(screen.queryByText('Aviso anterior')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('tab',{name:'Leídas (1)'}));expect(screen.getByText('Aviso anterior')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('tab',{name:'Todas (3)'}));fireEvent.change(screen.getByRole('searchbox'),{target:{value:'informatica'}});
 expect(screen.getByText('Jornada programada')).toBeInTheDocument();expect(screen.queryByText('Plan aprobado')).not.toBeInTheDocument();
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'sin coincidencias'}});expect(screen.getByText('No encontramos ese aviso')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Limpiar búsqueda'}));expect(screen.getByText('Plan aprobado')).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Enviar aviso'})).not.toBeInTheDocument();
});
test('a failed read operation keeps the user in the inbox and provides a retry',async()=>{
 markAsRead.mockResolvedValue(null);render(<NotificationsPage/>);
 fireEvent.click(screen.getByRole('button',{name:/Plan aprobado/}));
 await screen.findByText('No se pudo completar la acción. Inténtalo de nuevo.');expect(openNotificationLink).not.toHaveBeenCalled();
 markAsRead.mockResolvedValue({read:true});fireEvent.click(screen.getByRole('button',{name:/Plan aprobado/}));
 await waitFor(()=>expect(openNotificationLink).toHaveBeenCalledWith('#/practices/7'));
});
test('batch read requires confirmation and errors never show an up-to-date success message',async()=>{
 render(<NotificationsPage/>);fireEvent.click(screen.getByRole('button',{name:'Marcar todas como leídas'}));
 await waitFor(()=>expect(markAllAsRead).toHaveBeenCalledTimes(1));expect(mockConfirm).toHaveBeenCalled();
});
test('a failed inbox request is explicit rather than an empty success state',()=>{
 useNotifications.mockReturnValue({notifications:[],unreadCount:0,error:'Sin conexión',loading:false,markAsRead,markAllAsRead,refresh});render(<NotificationsPage/>);
 expect(screen.getByText('No se pudo actualizar la bandeja')).toBeInTheDocument();expect(screen.queryByText('Tu bandeja está al día')).not.toBeInTheDocument();expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión');
});
test('the administrator can open the announcement form without sending anything',()=>{
 mockRoles=['ROLE_ADMIN'];render(<NotificationsPage/>);fireEvent.click(screen.getByRole('button',{name:'Enviar aviso'}));
 expect(screen.getByRole('dialog',{name:'Enviar aviso'})).toBeInTheDocument();expect(screen.getByLabelText('Título')).toBeInTheDocument();
});
