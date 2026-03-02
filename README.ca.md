[🇪🇸 Versión en español](README.md) | [🇺🇸 English version](README.en.md)

# NotebookLM Organizer 🏷️

**NotebookLM Organizer** és una extensió de navegador dissenyada per potenciar l'organització del teu espai de treball a [NotebookLM](https://notebooklm.google.com). Mitjançant un sistema d'etiquetes de colors i filtratge avançat, permet gestionar els teus quaderns amb una experiència d'usuari fluida i completament integrada, que se sent com una funcionalitat nativa de la plataforma.

![notebookLM Organizer GIF](assets/overview.gif)

---

## 🔒 Privadesa i seguretat

La privadesa és el pilar fonamental d'aquesta extensió. NotebookLM Organizer ha estat dissenyada sota el principi de **mínim accés necessari**:

- **Sense accés al contingut:** l'extensió **en cap moment** llegeix, accedeix ni processa el contingut del text, documents o fonts que guardes dins dels teus quaderns.
- **Només metadades organitzatives:** únicament detecta el **nom del quadern, el nombre de fonts i la data de creació**. Aquestes dades s'utilitzen exclusivament per identificar el quadern i associar-li les teves etiquetes.
- **Sense manipulació de dades:** l'extensió no modifica ni manipula els teus quaderns de cap manera. Només afegeix una capa visual d'organització sobre la interfície existent de Google.
- **Les teves dades són teves:** tota la configuració s'emmagatzema al teu compte de Google (via Chrome Sync) i només tu hi tens accés.

---

## ✨ Característiques destacades

- 🏷️ **Etiquetatge amb colors:** crea etiquetes personalitzades amb una paleta de colors vibrants per categoritzar els teus projectes visualment.
- 🔍 **Filtratge avançat:** localitza quaderns a l'instant combinant cerca per text i filtres d'etiquetes amb lògica **Y (AND)** o **O (OR)**.
- 🌓 **Mode fosc automàtic:** la interfície s'adapta automàticament al tema (clar o fosc) que tinguis configurat a NotebookLM, respectant la teva preferència visual al 100%.
- 🔄 **Sincronització automàtica:** les teves etiquetes i preferències es sincronitzen automàticament entre tots els teus dispositius mitjançant el teu compte de Chrome.
- 💾 **Còpia de seguretat granular:** exporta i importa la teva configuració en format JSON, permetent triar quins elements restaurar.
- 🌐 **Suport multi-idioma:** interfície localitzada íntegrament en **espanyol, anglès i català**, amb canvi d'idioma instantani des de la interfície.
- 💡 **Gestió de destacats:** per neteja i conveniència, l'extensió oculta la vista prèvia limitada de quaderns destacats a la pestanya principal "Tots" i s'inhibeix automàticament a la pestanya de "Destacats".
- ⚡ **Interfície nativa:** dissenyada per oferir una experiència d'ús amb funcions ampliades que se sentin com a natives de NotebookLM, sense trencar el teu flux de treball.

---

## ⚠️ Nota important sobre la vista de llista

A causa que NotebookLM no exposa identificadors únics interns en totes les seves vistes, l'extensió utilitza una "empremta digital" basada en metadades per identificar cada quadern.

Si tens diversos quaderns amb el **mateix nom, mateix nombre de fonts i mateixa data**, l'extensió detectará una **col·lisió** a la vista de llista i bloquejarà l'etiquetatge per seguretat per evitar errors d'associació. En aquests casos, apareixerà una icona d'avís (⚠️) i hauràs d'utilitzar la **vista de miniatures** (quadrícula) per etiquetar-los, ja que en aquesta vista sí que és possible obtenir un identificador únic real.

---

## ⚙️ Detalls tècnics

*   **Sense frameworks ni dependències externes:** desenvolupada íntegrament amb **Vanilla JS** i **CSS estàndard** per garantir la màxima lleugeresa, velocitat i compatibilitat.
*   **Manifest V3:** l'extensió utilitza l'última versió del manifest de Chrome per garantir la màxima seguretat i rendiment.
*   **Chrome Storage Sync & Local:** utilitza l'API d'emmagatzematge per mantenir les etiquetes sincronitzades entre dispositius i realitzar memòria cau local.
*   **i18n dinàmic:** implementa un sistema de localització propi que permet el canvi d'idioma instantani sense necessitat de recarregar la pàgina.
*   **MutationObserver:** s'utilitza per detectar de forma eficient i reactiva quan s'afegeixen nous quaderns a la llista o es produeixen canvis en la navegació.
*   **Fragmentació de dades (chunking):** sistema avançat per superar el límit de 8 KB de Chrome Sync mitjançant la divisió de dades en fragments.
*   **ID d'extensió predefinit:** el `manifest.json` inclou una clau pública (`key`) per assegurar que l'ID de l'extensió sigui idèntic en totes les instal·lacions manuals, la qual cosa és requisit indispensable perquè funcioni la sincronització (Chrome Sync).
*   **Permisos:**
    *   `storage`: per guardar i sincronitzar les teves etiquetes i preferències.

---

## 💾 Còpia de seguretat i seguretat de les teves dades

Encara que l'extensió sincronitza les teves dades automàticament a través del teu compte de Google, es recomana encaridament **realitzar una còpia de seguretat local periòdica** de les teves etiquetes.

Utilitza els botons d'**Exportar (💾)** i **Importar (📂)** situats al modal de gestió d'etiquetes per descarregar un fitxer JSON amb la teva configuració. Aquesta pràctica és especialment important abans de:
- Desinstal·lar l'extensió.
- Realitzar una actualització manual (especialment si l'ID de l'extensió pogués canviar).
- Canviar de perfil de Chrome.

---

## 🛠️ Instal·lació (en mode desenvolupador)

Segueix aquests passos per instal·lar l'extensió de forma local:

1. Descarrega i descomprimeix l'arxiu zip o clona aquest repositori al teu equip.
2. Obre Google Chrome i dirigeix-te a la pàgina d'extensions: `chrome://extensions`.
3. Activa el **"Mode de desenvolupador"** a la part superior dreta.
4. Fes clic al botó **"Càrrega descomprimida"**.
5. Selecciona la carpeta **extension** dins de la carpeta del projecte que has descarregat o clonat.
6. Fet! L'extensió apareixerà al teu llistat d'extensions i estarà activa a `notebooklm.google.com`.

---

## 📝 Nota sobre la publicació a la Chrome Web Store

Atès que l'extensió es basa en l'anàlisi de l'estructura del DOM de l'aplicació NotebookLM, i aquesta pot canviar en qualsevol moment sense previ avís, l'autor prefereix no publicar-la per ara a la Chrome Web Store. El cost de manteniment i la necessitat d'adaptar-la a canvis freqüents fan que sigui més pràctic distribuir-la com un projecte de codi obert per a la seva instal·lació manual.

> **Important per a la publicació:** Si vols publicar la teva pròpia versió a l'Store, s'ha inclòs el fitxer **`extension/manifest.webstore.json`**. Aquest fitxer és una versió "neta" que **no inclou la propietat `key`**, requisit indispensable perquè Google assigni un ID oficial a la teva publicació.
> 
> Per fer-lo servir, simplement canvia el nom de `manifest.webstore.json` a `manifest.json` (sobrescrivint l'original) just abans de comprimir la carpeta `extension` en un fitxer `.zip` per a la seva pujada a la consola de desenvolupadors.

---

## 🤝 Crèdits

Aquest projecte ha estat creat i és mantingut per **Pablo Felip** ([LinkedIn](https://www.linkedin.com/in/pfelipm/) | [GitHub](https://github.com/pfelipm)).

---

## 📄 Llicència

Aquest projecte es distribueix sota els termes de l'arxiu [LICENSE](LICENSE).
