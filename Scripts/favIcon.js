const head = document.head;

const icons = [
    { rel: "icon", type: "image/png", href: "Imagenes/icono.png" },
    { rel: "shortcut icon", href: "Imagenes/icono.png" },
    { rel: "apple-touch-icon", href: "Imagenes/icono.png" }
];

icons.forEach(({ rel, type, href }) => {
    const link = document.createElement("link");
    link.rel = rel;
    if (type) link.type = type;
    link.href = href;
    head.appendChild(link);
});