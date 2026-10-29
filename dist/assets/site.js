'use strict';

// Contact details are intentionally unset until the first visual review.
// A query can still be prepared, edited, copied and downloaded in the browser.
const SITE = {
  email: null,
  whatsapp: null,
  balticaUrl: null,
  vueltitoUrl: 'https://vueltito.legios.com.ar/'
};

const projects = {
  vueltito: {
    category: 'Gestión para comercios / producto',
    status: 'Vueltito',
    title: 'El negocio, sin vueltas.',
    lead: 'Un sistema pensado alrededor de lo que pasa todos los días en un comercio.',
    description: 'Cobrar, mantener los precios, cargar productos y ordenar la operación. Vueltito reúne esas tareas en una herramienta con palabras claras y una identidad propia.',
    scopeHeading: 'En foco',
    scope: ['Caja y operación del comercio.', 'Precios, productos y etiquetas.', 'Pedidos y cuentas de clientes.', 'Carga de facturas de proveedores.'],
    url: SITE.vueltitoUrl
  },
  baltica: {
    category: 'Comercio electrónico / Empretienda',
    status: 'Báltica',
    title: 'Una tienda con otra presencia.',
    lead: 'El rediseño de la tienda de Báltica en Empretienda.',
    description: 'Un trabajo sobre cómo se presenta la marca en su espacio de venta online. La composición de esta página es una ilustración de la dirección visual, no una captura de la tienda.',
    scopeHeading: 'El trabajo',
    scope: ['Rediseño de la tienda existente.', 'Presentación de marca en Empretienda.', 'Una experiencia de compra cuidada.'],
    url: SITE.balticaUrl
  },
  ladece: {
    category: 'ERP integral / próximo proyecto',
    status: 'En planificación',
    title: 'Toda la operación, conectada.',
    lead: 'Un ERP integral para LADECE: del pedido a la producción y de la compra a la administración.',
    description: 'El alcance contempla el conjunto de la operación del laboratorio. El relevamiento definirá cómo se relacionan los módulos, los datos que comparten y el orden de las entregas.',
    scopeHeading: 'Alcance a desarrollar',
    scope: ['Ventas, clientes y pedidos.', 'Compras, proveedores y recepción.', 'Producción e insumos.', 'Inventario, lotes y vencimientos.', 'Calidad y trazabilidad.', 'Administración, cuentas corrientes y reportes.'],
    url: null
  }
};

const menuButton = document.querySelector('.menu-button');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
  mobileNav.hidden = !opening;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width:651px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

document.querySelectorAll('details.service').forEach(details => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('details.service').forEach(other => {
      if (other !== details) other.open = false;
    });
  });
});

const projectDialog = document.getElementById('project-dialog');
const briefDialog = document.getElementById('brief-dialog');
function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add('dialog-open');
}
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});

document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    document.getElementById('dialog-category').textContent = project.category;
    document.getElementById('dialog-status').textContent = project.status;
    document.getElementById('dialog-title').textContent = project.title;
    document.getElementById('dialog-lead').textContent = project.lead;
    document.getElementById('dialog-description').textContent = project.description;
    document.getElementById('dialog-scope-heading').textContent = project.scopeHeading;
    const list = document.getElementById('dialog-scope');
    list.replaceChildren(...project.scope.map(item => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
    const external = document.getElementById('dialog-external');
    external.hidden = !project.url;
    if (project.url) external.href = project.url;
    else external.removeAttribute('href');
    openDialog(projectDialog);
  });
});
document.getElementById('dialog-contact').addEventListener('click', () => projectDialog.close());

const briefForm = document.getElementById('brief-form');
const briefText = document.getElementById('brief-text');
const copyStatus = document.getElementById('copy-status');
const contactAddress = document.getElementById('contact-address');
const sendBrief = document.getElementById('send-brief');

function contactUrl(text) {
  if (SITE.whatsapp) {
    const digits = SITE.whatsapp.replace(/\D/g, '');
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
  }
  if (SITE.email) {
    return 'mailto:' + SITE.email + '?subject=' + encodeURIComponent('Una idea para Wiz Sunshine') + '&body=' + encodeURIComponent(text);
  }
  return null;
}
function refreshContactLink() {
  const target = contactUrl(briefText.value);
  sendBrief.hidden = !target;
  if (target) sendBrief.href = target;
  else sendBrief.removeAttribute('href');
}
if (SITE.email || SITE.whatsapp) {
  const link = document.createElement('a');
  link.textContent = SITE.email || SITE.whatsapp;
  link.href = SITE.email ? 'mailto:' + SITE.email : 'https://wa.me/' + SITE.whatsapp.replace(/\D/g, '');
  contactAddress.append(link);
  contactAddress.hidden = false;
  document.getElementById('contact-submit-label').textContent = 'Preparar mi mensaje';
  document.getElementById('form-note').textContent = 'Revisá tu consulta y abrila en tu app de mensajes.';
  document.getElementById('brief-explanation').textContent = 'Tu mensaje está listo. Revisalo y abrilo para enviarlo cuando quieras.';
}

briefForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!briefForm.reportValidity()) return;
  const values = new FormData(briefForm);
  const lines = [
    'Hola, Wiz Sunshine.',
    '',
    'Soy ' + String(values.get('name')).trim() + '.',
    values.get('business') ? 'Mi proyecto o negocio: ' + String(values.get('business')).trim() : null,
    'Estoy buscando: ' + String(values.get('projectType')) + '.',
    '',
    String(values.get('message')).trim(),
    '',
    '¿Podemos conversar sobre esta idea?'
  ].filter(line => line !== null);
  briefText.value = lines.join('\n');
  copyStatus.textContent = '';
  refreshContactLink();
  openDialog(briefDialog);
});
briefText.addEventListener('input', () => {
  copyStatus.textContent = '';
  refreshContactLink();
});
document.getElementById('copy-brief').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(briefText.value);
    copyStatus.textContent = 'Consulta copiada. Ya podés compartirla.';
  } catch {
    briefText.focus();
    briefText.select();
    copyStatus.textContent = 'Seleccionamos el texto para que puedas copiarlo.';
  }
});
document.getElementById('download-brief').addEventListener('click', () => {
  const blob = new Blob([briefText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mi-idea-para-wiz-sunshine.txt';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  copyStatus.textContent = 'La consulta está preparada como archivo de texto.';
});
document.getElementById('year').textContent = String(new Date().getFullYear());

// A small, static, original canvas illustration. No image or third-party script.
function paintSky() {
  const canvas = document.getElementById('sunshine-sky');
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = 650, height = 230;
  canvas.width = width;
  canvas.height = height;
  const frame = context.createImageData(width, height);
  let seed = 29062026;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const gaussian = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) ** 2) / sx + ((y - cy) ** 2) / sy));
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width, ny = y / height;
      const fade = Math.max(0, 1 - ny) ** 1.35;
      const gold = gaussian(nx, ny, .24, .13, .12, .45);
      const pink = gaussian(nx, ny, .02, .1, .04, .3);
      const violet = gaussian(nx, ny, .87, .08, .12, .3);
      const blue = gaussian(nx, ny, .69, .2, .025, .19);
      const grain = (random() - .5) * 48 + (bayer[(y % 4) * 4 + (x % 4)] - 7.5) * 1.1;
      const i = (y * width + x) * 4;
      frame.data[i] = 250 - (gold * 1 + pink * 5 + violet * 58 + blue * 82) * fade + grain;
      frame.data[i + 1] = 249 - (gold * 42 + pink * 69 + violet * 77 + blue * 22) * fade + grain;
      frame.data[i + 2] = 245 - (gold * 137 + pink * 35 + violet * 5 + blue * 1) * fade + grain;
      frame.data[i + 3] = Math.round(255 * Math.min(1, fade * 1.8));
    }
  }
  context.putImageData(frame, 0, 0);
}
paintSky();
