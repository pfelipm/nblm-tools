[🇪🇸 Versión en español](README.md) | [🇺🇸 English version](README.en.md)

# NotebookLM Organizer 🏷️

**NotebookLM Organizer** és una extensió de navegador dissenyada per potenciar l'organització del teu espai de treball a [NotebookLM](https://notebooklm.google.com). Mitjançant un sistema d'etiquetes de colors i filtratge avançat, permet gestionar els teus quaderns amb una experiència d'usuari fluida i completament integrada, que se sent com una funcionalitat nativa de la plataforma.

![notebookLM Organizer GIF](assets/overview.gif)

---

## 🔒 Privadesa i seguretat

La privadesa és el pilar fonamental d'aquesta extensió. NotebookLM Organizer ha estat dissenyada sota el principi de **mínim accés necessari**:

- **Sense accés al contingut:** l'extensió **en cap moment** llegeix, accedeix ni processa el contingut del text, documents o fonts que guardes dins dels teus quaderns.
- **Només metadades organitzatives:** únicament detecta el **nom del quadern, el nombre de fonts i la data de creació**. Aquestes dades s'utilitzen exclusivament per identificar el quadern i associar-li les teves etiquetes.
- **Sense manipulació de dades:** l'extensió no modifica ni manipula els teus quaderns de cap forma. Només afegeix una capa visual d'organització sobre la interfície existent de Google.
- **Les teves dades són teves:** tota la configuració s'emmagatzema al teu compte de Google (via Chrome Sync) i només tu hi tens accés.

---

## ✨ Característiques destacades

- 🏷️ **Etiquetatge amb colors:** crea etiquetes personalitzades amb una paleta de colors vibrants per categoritzar els teus projectes visualment.
- 🔍 **Filtratge avançat:** localitza quaderns a l'instant combinant cerca per text i filtres d'etiquetes amb lògica **I (AND)** o **O (OR)**.
- 🌓 **Mode fosc automàtic:** la interfície s'adapta automàticament al tema (clar o fosc) que tinguis configurat a NotebookLM, respectant la teva preferència visual al 100%.
- 🔄 **Sincronització automàtica:** les teves etiquetes i preferències es sincronitzen automàticament entre tots els teus dispositius mitjançant el teu compte de Chrome.
- 💾 **Respatller granular:** exporta i importa la teva configuració en format JSON, permetent triar quins elements restaurar.
- 🌐 **Suport multi-idioma:** interfície localitzada íntegrament en **espanyol, anglès i català**, amb canvi d'idioma instantani des de la interfície.
- 💡 **Gestió de destacats:** per neteja i conveniència, l'extensió oculta la vista prèvia limitada de quaderns destacats a la pestanya principal "Tots" i s'inhibeix automàticament a la pestanya de "Destacats".
- ⚡ **Interfície nativa:** dissenyada per oferir una experiència d'ús amb funcions ampliades que se sentin com natives de NotebookLM, sense trencar el teu flux de treball.

---

## ⚠️ Nota important sobre la vista de llista

Atès que NotebookLM no exposa identificadors únics interns en totes les seves vistes, l'extensió utilitza una "petjada digital" basada en metadades per identificar cada quadern. 

Si tens diversos quaderns amb el **mateix nom, mateix nombre de fonts i mateixa data**, l'extensió detectará una **col·lisió** a la vista de llista i bloquejarà l'etiquetatge per seguretat per evitar errors d'associació. En aquests casos, apareixerà una icona d'avís (⚠️) i hauràs d'utilitzar la **vista de miniaturas** (quadrícula) per etiquetar-los, ja que en aquesta vista sí que és possible obtenir un identificador único real.

---

## ⚙️ Detalls tècnics

*   **Sense frameworks ni dependències externes:** desenvolupada íntegramente amb **Vanilla JS** i **CSS estàndard** per garantir la màxima lleugeresa, velocitat i compatibilitat.
*   **Manifest V3:** l'extensió utilitza l'última versió del manifest de Chrome per garantir la màxima seguretat i rendiment.
*   **Chrome Storage Sync & Local:** utilitza l'API d'emmagatzematge per mantenir les etiquetes sincronitzades entre dispositius i realitzar cachè local de seguretat.
*   **Dynamic i18n:** implementa un sistema de localització propi que permet el canvi d'idioma instantani sense necessitat de recarregar la pàgina.
*   **MutationObserver:** s'utilitza per detectar de forma eficient i reactiva quan s'afegeixen nous quaderns a la llista o es produeixen canvis en la navegació.
*   **Fragmentació de dades (chunking):** sistema avançat per superar el límit de 8 KB de Chrome Sync mitjançant la divisió de dades en fragments.
*   **ID d'extensió predefinit:** el `manifest.json` incluye una clau pública (`key`) per assegurar que l'ID de l'extensió sigui idèntic en totes les instal·lacions manuals.
*   **Permisos:**
    *   `storage`: per guardar i sincronitzar les teves etiquetes i preferències.

---

## 💾 Gestió de dades i seguretat (Branca Experimental)

NotebookLM Organizer integra un motor de sincronización adaptatiu con **recuperació heurística** per garantir la màxima seguretat de la teva organització:

### 🛠️ Funcionament en mode de desenvolupament (instal·lació manual)
En aquest mode, l'extensió activa un **sistema de seguretat de redundància dual**:

-   **Backup local persistent (LocalStorage):** A més del núvol, les teves etiquetes es guarden físicament a la base de dades local de cada dispositiu.
-   **Recuperació heurística (Efecte guardià):** Si les dades del teu compte de Google s'esborren (per una desinstal·lació en un altre PC), qualsevol dispositiu on mantinguis instal·lada l'extensió detectarà l'anomalia. Si el núvol apareix buit o amb una pèrdua massiva de dades (>50% d'etiquetes perdudes), l'extensió **fusionarà automàticament** les dades del núvol amb la seva còpia local per ressuscitar la teva configuració.
-   **Avís persistent:** Veuràs un bàner informatiu al modal de gestió d'etiquetes.

### 🏪 Funcionament en mode store (Chrome Web Store)
A la botiga oficial, l'extensió simplifica la seva lògica i confia plenament en la infraestructura nativa de Google Sync, operant sense backups locals redundants.

### ⚠️ Recomanacions de seguretat
-   **Conserva sempre un "guardià":** Mentre mantinguis l'extensió instal·lada en almenys un dispositiu, les teves dades es podran recuperar automàticament gràcies a la redundància local.
-   **Exportació manual (💾):** Realitza còpies de seguretat periòdiques en JSON. És la teva xarxa de seguretat definitiva per si tota la resta falla. *Shit happens* 😅.
-   **Actualitzacions:** No desinstal·lis l'extensió per actualitzar en mode dev. Sobreescriu els fitxers i prem recarregar a `chrome://extensions`.

---

## 🛠️ Instal·lació (en mode desenvolupador)

Segueix aquests passos per instal·lar l'extensió de forma local:

1. Descarrega i descomprimeix l'arxiu zip o clona aquest repositori al teu equip.
2. Obre Google Chrome i ves a la pàgina d'extensions: `chrome://extensions`.
3. Activa el **"Mode de desenvolupador"** a la part superior dreta.
4. Fes clic en el botó **"Carrega descomprimida"**.
5. Selecciona la carpeta **extension** dins de la carpeta del projecte que has descarregat o clonat.
6. Fet! L'extensió apareixerá al teu llistat d'extensions i estará activa a `notebooklm.google.com`.

---

## 📝 Nota sobre la publicació a la Chrome Web Store

Atès que l'extensió es basa en l'anàlisi de l'estructura del DOM de l'aplicació NotebookLM, i aquesta pot canviar en qualsevol moment sense previ avís, l'autor prefereix no publicar-la per ara a la Chrome Web Store. El cost de manteniment i la necessitat d'adaptar-la a canvis freqüents fan que sigui més pràctic distribuir-la com un projecte de codi obert per a la seva instal·lació manual.

> **Important per a la publicació:** Si vols publicar la teva pròpia versió a la Store, s'ha inclòs l'arxiu **`extension/manifest.webstore.json`**. Aquest arxiu és una versió "neta" que **no inclou la propietat `key`**, requisit indispensable perquè Google assigni un ID oficial a la teva publicació. 
> 
> Per fer-lo servir, simplement canvia el nom de `manifest.webstore.json` a `manifest.json` (sobreescrivint l'original) just abans de comprimir la carpeta `extension` en un arxiu `.zip` per a la seva pujada a la consola de desarrolladors.

---

## 🤝 Crèdits

Este projecte ha estat creat i és mantingut per **Pablo Felip** ([LinkedIn](https://www.linkedin.com/in/pfelipm/) | [GitHub](https://github.com/pfelipm)).

---

## 📄 Llicència

Aquest projecte es distribueix sota els termes de l'arxiu [LICENSE](LICENSE).
