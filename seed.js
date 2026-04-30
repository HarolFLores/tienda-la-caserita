const mongoose = require('mongoose');
require('dotenv').config();
const Producto = require('./models/Producto');
const Categoria = require('./models/Categoria');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BDTiendaCaserita';

// --- DATOS ORIGINALES DE TU APP.JS ---

const categoriasData = [
    { id: "carnes", nombre: "Carnes y Aves", desc: "Pollo, Res", img: "https://media.istockphoto.com/id/505207430/es/foto/mariscos-frescos-y-bistecs-de-carne-de-res.jpg?s=612x612&w=0&k=20&c=UKxPwxvPUlDgh0U5byXg1RX1_egoBJOgUi9bii_jdRI=" },
    { id: "bebidas", nombre: "Bebidas", desc: "Gaseosas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPAsc-Jmv3fltpgZv7XZVWj7WZXzbZm4TpMA&s" },
    { id: "verduras", nombre: "Verduras", desc: "Frescas", img: "https://www.shutterstock.com/image-photo/fresh-raw-vegetables-fruits-260nw-2539811481.jpg" },
    { id: "abarrotes", nombre: "Abarrotes", desc: "Arroz, Fideos", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt7luwWudEp8Nx0gcDLW4pkXjnHjl9f-FPDQ&s" },
    { id: "lacteos", nombre: "Lácteos", desc: "Leche, Queso", img: "https://img.freepik.com/foto-gratis/productos-lacteos_114579-8756.jpg?semt=ais_hybrid&w=740&q=80" },
    { id: "panaderia", nombre: "Panadería", desc: "Pan fresco", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMKKxNBZcPiIu1Jr497k40gLZw2qSXShYFcQ&s" },
    { id: "congelados", nombre: "Congelados", desc: "Helados", img: "https://www.shutterstock.com/image-photo/set-various-frozen-products-260nw-2540473261.jpg" },
    { id: "limpieza", nombre: "Limpieza", desc: "Detergentes", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS52XtMxf4lhSEJNqSOaRGon-b_1e19KjvW1A&s" },
    { id: "dulces", nombre: "Dulces", desc: "Golosinas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQturWP-7YADo5oPHdfM7eS_5PYCXYc6VEGQ&s" }
];

const sugerenciasData = [
    { id: 1001, titulo: "Pavita Fresca", precio: 12.50, stock: 8, img: "https://thumbs.dreamstime.com/b/pavo-entero-crudo-fresco-133113047.jpg", esSugerencia: true },
    { id: 1002, titulo: "Lomo de Res", precio: 28.00, stock: 5, img: "https://carnesoasis.com/wp-content/uploads/2020/09/Lomo-Res.png", esSugerencia: true },
    { id: 1003, titulo: "Pescado Bonito", precio: 14.00, stock: 10, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVRY0wIbQJGHyGa5BzeCDGrgGZa2bujUT-hA&s", esSugerencia: true },
    { id: 1004, titulo: "Pollo Campesino", precio: 11.50, stock: 12, img: "https://www.carnave.com.ar/wp-content/uploads/2020/05/Pollo-entero.jpg", esSugerencia: true },
    { id: 1005, titulo: "Chancho Fresco", precio: 18.50, stock: 6, img: "https://media.istockphoto.com/id/1162194568/es/foto/carne-de-cerdo-cruda-en-rodajas-con-romero-aislado-sobre-fondo-blanco-vista-superior-lay-plano.jpg?s=612x612&w=0&k=20&c=-8rMdDiziophTit9ytIveSdXRxP7TXiFh_mlrQC_1zQ=", esSugerencia: true },
    { id: 1006, titulo: "Trucha Fresca", precio: 22.00, stock: 4, img: "https://media.falabella.com/tottusPE/41175670_1/w=1500,h=1500,fit=cover", esSugerencia: true }
];

const productosData = [
    { id: 1, titulo: "Pollo Entero", precio: 9.50, cat: "carnes", momento: "almuerzo", subcat: "carnes_aves", img: "https://www.carnave.com.ar/wp-content/uploads/2020/05/Pollo-entero.jpg" },
    { id: 2, titulo: "Carne Pura", precio: 34.90, cat: "carnes", momento: "almuerzo", subcat: "carnes_aves", img: "https://media.istockphoto.com/id/468329068/es/foto/solomillo-de-carne-de-res.jpg?s=612x612&w=0&k=20&c=poUUvflNvNzUPH_rK--uRuyG60YAG-6_mUmnI47rvhM=" },
    { id: 3, titulo: "Chuleta de Cerdo", precio: 19.90, cat: "carnes", momento: "cena", subcat: "carnes_aves", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdJxwtqygAiYoUUxO_f8yzxrcQnbr3xJrNMQ&s" },
    { id: 4, titulo: "Pechuga de Pollo", precio: 14.00, cat: "carnes", momento: "cena", subcat: "carnes_aves", img: "https://metroio.vtexassets.com/arquivos/ids/504824/FILETE-DE-PECHUGA-POLLO-REDONDOS-KG-3-241064.jpg?v=638386150340800000" },
    { id: 5, titulo: "Res Molida", precio: 15.00, cat: "carnes", momento: "almuerzo", subcat: "carnes_aves", img: "https://carnesideal.tienda/cdn/shop/products/RES42-1_c8c8e1d5-3747-4c5c-a7d0-0425fb68d7ec.jpg?v=1747962557" },
    { id: 6, titulo: "Leche Gloria", precio: 4.50, cat: "lacteos", momento: "desayuno", subcat: "avenas_cereales", img: "https://corporacionliderperu.com/50720-home_default/gloria-leche-tarro-azul-gde-x-390-gr.jpg" },
    { id: 7, titulo: "Huevos Pardos x30", precio: 16.00, cat: "lacteos", momento: "desayuno", subcat: "panaderia_untables", img: "https://images.rappi.pe/products/1733795403898_1733795104373_1733795104093.png" },
    { id: 8, titulo: "Queso Fresco", precio: 12.00, cat: "lacteos", momento: "desayuno", subcat: "panaderia_untables", img: "https://mercampo.pe/wp-content/uploads/2021/12/queso-fresco.jpg" },
    { id: 9, titulo: "Yogurt Gloria", precio: 6.50, cat: "lacteos", momento: "lonchera", subcat: "jugos_galletas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3vwkbPhi3O-zUfprBFhcdz3GHRajazBAvRg&s" },
    { id: 10, titulo: "Mantequilla Gloria", precio: 8.00, cat: "lacteos", momento: "desayuno", subcat: "panaderia_untables", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF69C22fBlJhUayaZs1L3Epb2WVriZMJ9jiA&s" },
    { id: 11, titulo: "Coca Cola 2L", precio: 8.00, cat: "bebidas", momento: "almuerzo", subcat: "bebidas_almuerzo", img: "https://www.happydrinkdelivery.com/wp-content/uploads/2022/04/COCA-COLA-2.25-L.jpg" },
    { id: 12, titulo: "Inca Kola 2L", precio: 8.00, cat: "bebidas", momento: "almuerzo", subcat: "bebidas_almuerzo", img: "https://tofuu.getjusto.com/orioneat-local/resized2/QKRJMeNW4ds3qYmZJ-1000-x.webp" },
    { id: 13, titulo: "Agua San Luis", precio: 2.50, cat: "bebidas", momento: "lonchera", subcat: "jugos_galletas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3DyxJ7RLy1LjwXB7odbxXFhXIOyx9RfrAhQ&s" },
    { id: 14, titulo: "Cerveza Pilsen", precio: 6.50, cat: "bebidas", momento: "almuerzo", subcat: "bebidas_almuerzo", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeyv-kJQQ34yFbF9mjmAFJUv2rErOiQ39HVg&s" },
    { id: 15, titulo: "Jugo de Naranja", precio: 5.00, cat: "bebidas", momento: "desayuno", subcat: "avenas_cereales", img: "https://img.freepik.com/fotos-premium/vista-frontal-botella-vidrio-jugo-naranja-aislado-blanco_143106-341.jpg" },
    { id: 16, titulo: "Gaseosa Fanta", precio: 7.00, cat: "bebidas", momento: "lonchera", subcat: "jugos_galletas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQadW0RMjFRhRuKaIPKVxfEf5nKyqRYZIgVmg&s" },
    { id: 17, titulo: "Papa Amarilla", precio: 4.50, cat: "verduras", momento: "almuerzo", subcat: "verduras_frescas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsR5lji1T9wK3QDckg_ssbMwM--qfGfBj-cw&s" },
    { id: 18, titulo: "Tomate Kg", precio: 3.20, cat: "verduras", momento: "almuerzo", subcat: "verduras_frescas", img: "https://www.quironsalud.com/es/comunicacion/actualidad/tomate.ficheros/2310627-tomate.jpg?width=400&height=311&aspectRatio=true" },
    { id: 19, titulo: "Cebolla Roja", precio: 2.50, cat: "verduras", momento: "almuerzo", subcat: "verduras_frescas", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3co9ZJjmAV6Bylv4Uuf9iaVzUk9bqBZRMZA&s" },
    { id: 20, titulo: "Zanahoria", precio: 2.00, cat: "verduras", momento: "almuerzo", subcat: "verduras_frescas", img: "https://media.istockphoto.com/id/1388403435/es/foto/fresca-zanahorias-aislado-sobre-fondo-blanco.jpg?s=612x612&w=0&k=20&c=2QC1KuEy3H_7nfPG72vfh1jJ4JaA_6EC9D5Afz62FNQ=" },
    { id: 21, titulo: "Lechuga", precio: 2.50, cat: "verduras", momento: "cena", subcat: "infusiones_ligeros", img: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300&q=80" },
    { id: 22, titulo: "Palta", precio: 8.00, cat: "verduras", momento: "desayuno", subcat: "panaderia_untables", img: "https://media.istockphoto.com/id/94929126/es/foto/avocados-aislado-en-blanco.jpg?s=612x612&w=0&k=20&c=jarWOCevkwfkgOfvDBkeOmOJvNlJFLhzRJpBg8jisno=" },
    { id: 23, titulo: "Arroz Costeño 1kg", precio: 5.50, cat: "abarrotes", momento: "almuerzo", subcat: "abarrotes_almuerzo", img: "https://plazavea.vteximg.com.br/arquivos/ids/27552446-450-450/433778.jpg?v=638313120991600000" },
    { id: 24, titulo: "Fideos Molitalia", precio: 3.00, cat: "abarrotes", momento: "almuerzo", subcat: "abarrotes_almuerzo", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsWwTEbSJaiW9pZnpaJeAb6P-ZlLTED9-h2g&s" },
    { id: 25, titulo: "Aceite Primor 1L", precio: 12.00, cat: "abarrotes", momento: "almuerzo", subcat: "abarrotes_almuerzo", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTrbDLC0IymIrZqPLrP4nwu6I4TaLM2T7KhQ&s" },
    { id: 26, titulo: "Sal Marina", precio: 1.50, cat: "abarrotes", momento: "almuerzo", subcat: "abarrotes_almuerzo", img: "https://aceleralastatic.nyc3.cdn.digitaloceanspaces.com/files/uploads/1499/1600843569-130-img-7343-jpg.jpg" },
    { id: 27, titulo: "Azúcar Rubia Bell's", precio: 4.00, cat: "abarrotes", momento: "desayuno", subcat: "avenas_cereales", img: "https://plazavea.vteximg.com.br/arquivos/ids/423248-418-418/20198552.jpg" },
    { id: 28, titulo: "Atún Florida", precio: 5.50, cat: "abarrotes", momento: "lonchera", subcat: "jugos_galletas", img: "https://veramendi.pe/100-superlarge_default/florida-grated-de-atun.jpg" },
    { id: 43, titulo: "Avena 3 Ositos", precio: 8.00, cat: "abarrotes", momento: "desayuno", subcat: "avenas_cereales", img: "https://www.molitalia.com.pe/wp-content/uploads/2020/09/avena-clasica-135g-frontal.jpg" },
    { id: 44, titulo: "Miel de Abeja", precio: 15.00, cat: "abarrotes", momento: "desayuno", subcat: "avenas_cereales", img: "https://miamarket.pe/assets/uploads/51b0c487ecfb4ea98e5710de010aafa5.jpg" },
    { id: 45, titulo: "Cereal Angel Zuck x140gr", precio: 12.00, cat: "abarrotes", momento: "desayuno", subcat: "avenas_cereales", img: "https://perufarma.com.pe/wp-content/uploads/2022/02/3.png" },
    { id: 29, titulo: "Pan Francés", precio: 0.30, cat: "panaderia", momento: "desayuno", subcat: "panaderia_untables", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3iIip_RxZhjNH_065UnhC_khjk_cNDHjxGw&s" },
    { id: 30, titulo: "Pan Integral", precio: 0.50, cat: "panaderia", momento: "desayuno", subcat: "panaderia_untables", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRkopILtL4xHM55qEDKpL5XsuBq2akQsvL9Q&s" },
    { id: 31, titulo: "Croissant", precio: 2.50, cat: "panaderia", momento: "desayuno", subcat: "panaderia_untables", img: "https://www.shutterstock.com/image-photo/two-freshly-baked-croissants-isolated-600nw-2698514233.jpg" },
    { id: 32, titulo: "Tostadas", precio: 4.00, cat: "panaderia", momento: "desayuno", subcat: "panaderia_untables", img: "https://media.istockphoto.com/id/1301934929/es/foto/baguette-tradicional-francesa-reci%C3%A9n-horneada.jpg?s=612x612&w=0&k=20&c=Ov42yLt-vWdJP8ycNfpExrlKBQZx3oqjCrQms-3O420=" },
    { id: 46, titulo: "Baguette Francesa", precio: 3.00, cat: "panaderia", momento: "desayuno", subcat: "panaderia_untables", img: "https://img.freepik.com/vector-premium/pila-pan-blanco-fondo-blanco_978445-1433.jpg?semt=ais_hybrid&w=740&q=80" },
    { id: 47, titulo: "Nutella 350g", precio: 20.00, cat: "abarrotes", momento: "desayuno", subcat: "panaderia_untables", img: "https://plazavea.vteximg.com.br/arquivos/ids/169247-450-450/57916.jpg?v=635769969062930000" },
    { id: 48, titulo: "Mermelada Fanny", precio: 8.00, cat: "abarrotes", momento: "desayuno", subcat: "panaderia_untables", img: "https://media.falabella.com/tottusPE/41141998_1/w=800,h=800,fit=pad" },
    { id: 33, titulo: "Helado Donofrio", precio: 15.00, cat: "congelados", momento: "lonchera", subcat: "jugos_galletas", img: "https://corporacionliderperu.com/51957-home_default/donofrio-helados-frio-rico-x-120-ml-vainilla-chips.jpg" },
    { id: 34, titulo: "Pizza Congelada", precio: 18.00, cat: "congelados", momento: "cena", subcat: "infusiones_ligeros", img: "https://media.istockphoto.com/id/183783388/es/foto/pizza-helado-tiefk%C3%BChlpizza.jpg?s=612x612&w=0&k=20&c=SDkXSy1vvy31bO3ivKh5YaBDmY65N4ZmulRaTWwrbAU=" },
    { id: 35, titulo: "Nuggets Pollo", precio: 12.00, cat: "congelados", momento: "lonchera", subcat: "jugos_galletas", img: "https://www.shutterstock.com/image-photo/frozen-nuggets-on-white-background-260nw-1178756149.jpg" },
    { id: 36, titulo: "Detergente Ariel", precio: 25.00, cat: "limpieza", momento: null, subcat: null, img: "https://oechsle.vteximg.com.br/arquivos/ids/23429237-1000-1000/20112038.jpg?v=639010303830400000" },
    { id: 37, titulo: "Lejía Clorox", precio: 8.00, cat: "limpieza", momento: null, subcat: null, img: "https://peru.clorox.com/wp-content/uploads/sites/14/2024/08/PE_Residual_Thin_Bleach_Lav_2000g_alta.png?height=500&dpr=2" },
    { id: 38, titulo: "Jabón Bolivar", precio: 3.50, cat: "limpieza", momento: null, subcat: null, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7RHYe-A7oqfVRCi8enwuwWbkJqNoqazHObw&s" },
    { id: 39, titulo: "Galletas Oreo", precio: 4.50, cat: "dulces", momento: "lonchera", subcat: "jugos_galletas", img: "https://www.farmadon.com.ve/wp-content/uploads/2025/07/Oreo-Galletas-Chocolate-X-6-Unidades-new.png" },
    { id: 40, titulo: "Chocolate Sublime", precio: 2.50, cat: "dulces", momento: "lonchera", subcat: "jugos_galletas", img: "https://www.nestleprofessional-latam.com/sites/default/files/styles/np_product_detail/public/2023-08/SUBLIME-EXTREMO.png?itok=UpnVYTPw" },
    { id: 41, titulo: "Caramelos Limon", precio: 3.00, cat: "dulces", momento: "lonchera", subcat: "jugos_galletas", img: "https://plazavea.vteximg.com.br/arquivos/ids/331794-450-450/990850.jpg?v=637267302511830000" },
    { id: 42, titulo: "Gomas de Fruta", precio: 2.00, cat: "dulces", momento: "lonchera", subcat: "jugos_galletas", img: "https://www.shutterstock.com/image-photo/sweet-jelly-gummy-bears-isolated-260nw-2659033235.jpg" },
    { id: 49, titulo: "Galleta Soda", precio: 3.20, cat: "dulces", momento: "lonchera", subcat: "jugos_galletas", img: "https://plazavea.vteximg.com.br/arquivos/ids/25835356-450-450/502139.jpg?v=638132704405000000" },
    { id: 50, titulo: "Té de Canela Herbi", precio: 2.50, cat: "abarrotes", momento: "cena", subcat: "infusiones_ligeros", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBR_djGdZA2WJKOyd15i5YZamY8jILHfX6hQ&s" },
    { id: 51, titulo: "Sopa Instantánea Ajinomen", precio: 3.00, cat: "abarrotes", momento: "cena", subcat: "infusiones_ligeros", img: "https://aceleralastatic.nyc3.cdn.digitaloceanspaces.com/files/uploads/1499/1602052298-66-ajinomen-gallina-jpg.jpg" },
    { id: 52, titulo: "Manzanilla Herbi", precio: 3.50, cat: "abarrotes", momento: "cena", subcat: "infusiones_ligeros", img: "https://vegaperu.vtexassets.com/arquivos/ids/158393-150-auto?v=637660220922070000&width=150&height=auto&aspect=true" }
];

// --- FUNCIÓN DE CARGA ---

async function importarDatos() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB...');

        // 1. Limpiar colecciones
        await Producto.deleteMany({});
        await Categoria.deleteMany({});
        console.log('🗑️  Datos anteriores borrados.');

        // 2. Insertar Categorías
        await Categoria.insertMany(categoriasData);
        console.log('📦 Categorías insertadas.');

        // 3. Insertar Productos (Normales y Sugerencias)
        await Producto.insertMany(sugerenciasData);
        await Producto.insertMany(productosData);
        console.log('🍎 Productos insertados.');

        console.log('✨ ¡Carga de datos completada exitosamente!');
        process.exit();
    } catch (error) {
        console.error('❌ Error importando datos:', error);
        process.exit(1);
    }
}

importarDatos();
