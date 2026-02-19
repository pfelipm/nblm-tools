[🇺🇸 English version](README.en.md)

# NotebookLM Organizer 🏷️

**NotebookLM Organizer** es una extensión de navegador diseñada para potenciar la organización de tu espacio de trabajo en [NotebookLM](https://notebooklm.google.com). Mediante un sistema de etiquetas de colores y filtrado avanzado, permite gestionar tus cuadernos con una experiencia de usuario fluida y completamente integrada, que se siente como una funcionalidad nativa de la plataforma.

---

## 🔒 Privacidad y Seguridad

La privacidad es el pilar fundamental de esta extensión. NotebookLM Organizer ha sido diseñada bajo el principio de **mínimo acceso necesario**:

- **Sin acceso al contenido:** La extensión **en ningún momento** lee, accede ni procesa el contenido del texto, documentos o fuentes que guardas dentro de tus cuadernos.
- **Solo metadatos organizativos:** Únicamente detecta el **nombre del cuaderno, el número de fuentes y la fecha de creación**. Estos datos se utilizan exclusivamente para identificar el cuaderno y asociarle tus etiquetas.
- **Sin manipulación de datos:** La extensión no modifica ni manipula tus cuadernos de ninguna forma. Solo añade una capa visual de organización sobre la interfaz existente de Google.
- **Tus datos son tuyos:** Toda la configuración se almacena en tu cuenta de Google (vía Chrome Sync) y solo tú tienes acceso a ella.

---

## ✨ Características Destacadas

- 🏷️ **Etiquetado con colores:** Crea etiquetas personalizadas con una paleta de colores vibrantes para categorizar tus proyectos visualmente.
- 🔍 **Filtrado Avanzado:** Localiza cuadernos al instante combinando búsqueda por texto y filtros de etiquetas con lógica **Y (AND)** u **O (OR)**.
- 🔄 **Sincronización Automática:** Tus etiquetas y preferencias se sincronizan automáticamente entre todos tus dispositivos mediante tu cuenta de Chrome.
- 💾 **Backup Granular:** Exporta e importa tu configuración en formato JSON, permitiendo elegir qué elementos restaurar.
- 🌐 **Soporte Multi-idioma:** Interfaz localizada íntegramente en **Español, Inglés y Català**, con cambio de idioma instantáneo desde la interfaz.
- ⚡ **Interfaz Nativa:** Diseñada para ofrecer una experiencia de uso con funciones ampliadas que se sientan como nativas de NotebookLM, sin romper tu flujo de trabajo.

---

## ⚙️ Detalles Técnicos

*   **Manifest V3:** La extensión utiliza la última versión del manifiesto de Chrome para garantizar la máxima seguridad y rendimiento.
*   **Chrome Storage Sync & Local:** Utiliza la API de almacenamiento para mantener las etiquetas sincronizadas entre dispositivos y realizar caché local.
*   **i18n Dinámico:** Implementa un sistema de localización propio que permite el cambio de idioma instantáneo sin necesidad de recargar la página.
*   **MutationObserver:** Se utiliza para detectar de forma eficiente y reactiva cuándo se añaden nuevos cuadernos a la lista o se producen cambios en la navegación.
*   **Fragmentación de Datos (Chunking):** Sistema avanzado para superar el límite de 8KB de Chrome Sync mediante la división de datos en fragmentos.
*   **Permisos:**
    *   `storage`: Para guardar y sincronizar tus etiquetas y preferencias.

---

## 🛠️ Instalación (en modo desarrollador)

Sigue estos pasos para instalar la extensión de forma local:

1. Descarga y descomprime el archivo zip o clona este repositorio en tu equipo.
2. Abre Google Chrome y dirígete a la página de extensiones: `chrome://extensions`.
3. Activa el **"Modo de desarrollador"** en la parte superior derecha.
4. Haz clic en el botón **"Cargar descomprimida"**.
5. Selecciona la carpeta del proyecto que has descargado.
6. ¡Listo! La extensión aparecerá en tu listado de extensiones y estará activa en `notebooklm.google.com`.

---

## 📝 Nota sobre la publicación en la Chrome Web Store

Dado que la extensión se basa en el análisis de la estructura del DOM de la aplicación NotebookLM, y esta puede cambiar en cualquier momento sin previo aviso, el autor prefiere no publicarla por ahora en la Chrome Web Store. El coste de mantenimiento y la necesidad de adaptarla a cambios frecuentes hacen que sea más práctico distribuirla como un proyecto de código abierto para su instalación manual.

---

## 🤝 Créditos

Este proyecto ha sido creado y es mantenido por **Pablo Felip** ([LinkedIn](https://www.linkedin.com/in/pfelipm/) | [GitHub](https://github.com/pfelipm)).

---

## 📄 Licencia

Este proyecto se distribuye bajo los términos del archivo [LICENSE](LICENSE).
