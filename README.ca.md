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

Si tens diversos quaderns amb el **mateix nom, mateix nombre de fonts i mateixa data**, l'extensió detectarà una **col·lisió** a la vista de llista i bloquejarà l'etiquetatge per seguretat per evitar errors d'associació. En aquests casos, apareixerà una icona d'avís (⚠️) i hauràs d'utilitzar la **vista de miniatures** (quadrícula) per etiquetar-los, ja que en aquesta vista sí que és possible obtenir un identificador único real.

---

## ⚙️ Detalls tècnics

*   **Sense frameworks ni dependències externes:** desenvolupada íntegrament amb **Vanilla JS** i **CSS estàndard** per garantir la màxima lleugeresa, velocitat i compatibilitat.
*   **Manifest V3:** l'extensió utilitza l'última versió del manifest de Chrome per garantir la màxima seguretat i rendiment.
*   **Chrome Storage Sync & Local:** utilitza l'API d'emmagatzematge per mantenir les etiquetes sincronitzades entre dispositius i realitzar cachè local de seguretat.
*   **Dynamic i18n:** implementa un sistema de localització propi que permet el canvi d'idioma instantani sense necessitat de recarregar la pàgina.
*   **MutationObserver:** s'utilitza per detectar de forma eficient i reactiva quan s'afegeixen nous quaderns a la llista o es produeixen canvis en la navegació.
*   **Fragmentació de dades (chunking):** sistema avançat per superar el límit de 8 KB de Chrome Sync mitjançant la divisió de dades en fragments.
*   **ID d'extensió predefinit:** el `manifest.json` inclou una clau pública (`key`) per assegurar que l'ID de l'extensió sigui idèntic en totes les instal·lacions manuals.
*   **Permisos:**
    *   `storage`: per guardar i sincronitzar les teves etiquetes i preferències.

---

## 💾 Gestió de dades i seguretat avançada

NotebookLM Organizer integra un motor de sincronització adaptatiu que detecta automàticament l'entorn d'instal·lació per garantir la màxima seguretat de la teva organització.

Atès que Google Chrome pot eliminar les dades de sincronització en desinstal·lar una extensió carregada manualment (Mode Dev), hem implementat un sistema de **Redundància Dual** i un **Assistent de Resolució de Conflictes**.

### 🛠️ Modes de seguretat en Desenvolupament (Instal·lació manual)
Mentre l'extensió s'utilitzi en mode de desenvolupament, disposaràs de tres nivells de protecció configurables des del modal de gestió d'etiquetes:

![Modes de sincronització](assets/modos-sync-dev.png)

1.  **Intel·ligent (Recomanat):** Utilitza una **heurística de confiança**. Si detecta una pèrdua massiva de dades al núvol (tenint almenys 3 etiquetes en local i detectant-ne menys de la meitat al núvol), el sistema activa l'assistent de recuperació.
2.  **Validació manual:** El mode més estricte. Sempre que hi hagi una discrepància en les mètriques entre aquest equip i el núvol, l'extensió et demanarà confirmar quina versió vols mantenir.
3.  **Només núvol:** Desactiva la redundància local i es comporta de forma minimalista, confiant exclusivament en Google Sync (comportament idèntic a la versió de la botiga).

### 🔄 Assistent de recuperació
Quan es detecta una inconsistència, l'extensió mostra un diàleg detallat amb mètriques comparatives perquè prenguis una decisió informada:

![Diàleg de conflicte](assets/alerta-fusión.png)

---

## 🧠 Filosofia de disseny: Independència i Resiliència

Durant el desenvolupament d'aquesta extensió, ens vam enfrontar a una decisió de disseny crítica: com evitar que Google esborri les dades de sincronització en desinstal·lar la versió de desenvolupament?

Una solució ràpida hauria estat registrar l'extensió a la Chrome Web Store per obtenir un **ID oficial**, el qual protegeix les dades al núvol de neteges automàtiques. No obstant això, vam optar per **no fer-ho** per prioritzar els següents principis:

1.  **Sobirania i Codi Obert:** En no dependre d'un ID assignat per una botiga propietària, el projecte és 100% independent i portable. Qualsevol persona pot clonar el repositori i tenir un sistema funcional i segur sense passar pel control d'una plataforma externa.
2.  **Arquitectura de Resiliència:** En lloc de confiar en una política de base de dades de tercers (que pot canviar), hem construït la nostra pròpia infraestructura de seguretat. L'extensió és ara un sistema autònom capaç d'autoreparar-se.
3.  **Transparència:** Aquest camí ens va obligar a crear l'**Assistent de Conflictes**, la qual cosa dona a l'usuari un control total i una visibilitat absoluta sobre la seva informació, quelcom que el sistema "invisible" de Google no proporciona.

En resum: hem triat el camí del **maestratge tècnic** sobre el camí curt, garantint que NotebookLM Organizer sigui una eina tan robusta com independent.

---

## 🏪 Funcionament en mode oficial (Chrome Web Store)

Si l'extensió s'instal·la des de la botiga oficial, detecta l'entorn i simplifica la seva lògica al màxim. En aquest mode, confia plenament en la infraestructura nativa de Google Sync i opera de forma lleugera sense necessitat de mantenir backups locals redundants ni mostrar diàlegs de conflicte.

### ⚠️ Recomanacions finals de seguretat
-   **Conserva sempre un "guardià":** Mentre mantinguis l'extensió instal·lada en almenys un dispositiu, les teves dades es podran recuperar automàticament en els altres gràcies a la redundància local.
-   **Exportació manual (💾):** Realitza còpies de seguretat periòdiques descarregant la teva configuració en format JSON. És la teva única garantia absoluta de recuperació davant canvis en les polítiques de Google. *Shit happens* 😅.
-   **Actualitzacions:** Per instal·lar una nova versió del codi en mode dev, no desinstal·lis l'extensió. Simplement sobreescriu els fitxers a la teva carpeta i prem el botó de recàrrega a `chrome://extensions`.

---

## 🛠️ Instal·lació (en mode desenvolupador)

...

## 📝 Nota sobre la publicació a la Chrome Web Store

Atès que l'extensió es basa en l'anàlisi de l'estructura del DOM de l'aplicació NotebookLM, i aquesta pot canviar en qualsevol moment sense previ avís, l'autor prefereix no publicar-la per ara a la Chrome Web Store. El cost de manteniment i la necessitat d'adaptar-la a canvis freqüents fan que sigui més pràctic distribuir-la com un projecte de codi obert per a la seva instal·lació manual.

> **Important per a la publicació:** Si vols publicar la teva pròpia versió a la Store, s'ha inclòs l'arxiu **`extension/manifest.webstore.json`**. Aquest arxiu és una versió "neta" que **no inclou la propietat `key`**, requisit indispensable perquè Google assigni un ID oficial a la teva publicació. 
> 
> Per fer-lo servir, simplement canvia el nom de `manifest.webstore.json` a `manifest.json` (sobreescrivint l'original) just abans de comprimir la carpeta `extension` en un arxiu `.zip` per a la seva pujada a la consola de desarrolladors.

---

## 🤝 Crèdits

... Applied fuzzy match at line 101-108.