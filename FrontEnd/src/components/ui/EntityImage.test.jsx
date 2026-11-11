/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImage.test.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las imágenes de las entidades mediante pruebas de regresión.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { EntityImagePicker, entityImagePayload, imageValidation } from './EntityImage';
jest.mock('../../features/auth/context/AuthContext', () => ({ useAuth: () => ({ token: 'test' }) }));
beforeEach(() => { URL.createObjectURL = jest.fn(() => 'blob:preview');URL.revokeObjectURL = jest.fn(); });
test('optional image preserves JSON and selected images travel with the creation payload', async () => {
 const data = { name: 'Práctica', academicCycleId: 7 };
 expect(entityImagePayload(data, null)).toBe(data);
 const file = new File(['png'], 'cover.png', { type: 'image/png' });
 const payload = entityImagePayload(data, file);
 expect(payload).toBeInstanceOf(FormData);expect(payload.get('image').name).toBe('cover.png');
 expect(payload.get('data').type).toBe('application/json');
});
test('invalid formats and oversized images cannot become the selected file', () => {
 expect(imageValidation(new File(['svg'], 'cover.svg', { type: 'image/svg+xml' }))).toMatch(/JPG o PNG/);
 expect(imageValidation({ type: 'image/png', size: 4*1024*1024+1 })).toMatch(/4 MB/);
 const change = jest.fn();render(<EntityImagePicker file={null} onChange={change} />);
 fireEvent.change(screen.getByLabelText('Portada opcional'), { target: { files: [new File(['text'], 'cover.svg', { type: 'image/svg+xml' })] } });
 expect(change).toHaveBeenCalledWith(null);expect(screen.getByRole('alert')).toHaveTextContent('JPG o PNG');
});
test('the creator can preview and clear the chosen image before saving', () => {
 const file = new File(['png'], 'cover.png', { type: 'image/png' });const change = jest.fn();
 const { unmount } = render(<EntityImagePicker file={file} onChange={change} />);
 expect(screen.getByAltText('Vista previa de la imagen elegida')).toHaveAttribute('src', 'blob:preview');
 fireEvent.click(screen.getByRole('button', { name: 'Quitar selección' }));expect(change).toHaveBeenCalledWith(null);
 unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});
