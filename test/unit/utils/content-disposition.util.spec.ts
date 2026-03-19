import { buildAttachmentContentDisposition } from '@/application/usuarios/utils/content-disposition.util';

describe('buildAttachmentContentDisposition', () => {
  it('incluye filename ASCII y filename* UTF-8', () => {
    const v = buildAttachmentContentDisposition('usuarios_all_2025-03-19.xlsx');
    expect(v).toContain('attachment;');
    expect(v).toContain('filename="usuarios_all_2025-03-19.xlsx"');
    expect(v).toContain("filename*=UTF-8''usuarios_all_2025-03-19.xlsx");
  });

  it('escapa caracteres no ASCII en filename de respaldo', () => {
    const v = buildAttachmentContentDisposition('usuarios_ñ_2025.xlsx');
    expect(v).toContain('filename="usuarios___2025.xlsx"');
    expect(v).toContain(
      "filename*=UTF-8''" + encodeURIComponent('usuarios_ñ_2025.xlsx'),
    );
  });
});
