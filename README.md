# ZOLLA — Island Builder v0.5

Mobile-first incremental city-builder a zolle/isole.

## Cosa cambia nella v0.5

- Funziona sia in verticale sia in orizzontale.
- Trascinamento della mappa con un dito/mouse.
- Pinch-to-zoom con due dita e zoom con rotella su desktop.
- Interfaccia fullscreen: nessun pannello laterale permanente.
- Pannello azioni dal basso, pensato per il pollice.
- 10 tipologie di edificio e 5 terreni.
- Catene produttive reali:
  - Fattorie → Cibo
  - Silvicoltura → Legno
  - Cave → Pietra
  - Officine: Legno + Pietra → Merci
  - Mercati: Merci → Monete
  - Porti: Merci + Cibo → Monete
- Popolazione che consuma cibo.
- Felicità cittadina che influenza l'economia.
- Bonus di terreno e bonus di quartiere/adiacenza.
- Ogni edificio arriva al livello 10.
- Dal livello 5 ogni zolla può scegliere una specializzazione permanente fra due rami.
- Missioni progressive con premi.
- Produzione offline fino a 8 ore.
- Salvataggio automatico locale.

## Avvio

Apri `index.html` nel browser. Non ci sono dipendenze esterne.

## File

- `index.html` — struttura UI
- `styles.css` — layout e UX mobile
- `game.js` — simulazione, renderer isometrico, economia e salvataggio

## Direzione successiva

- strade e piazze fisiche;
- residenti animati;
- navi e rotte commerciali;
- eventi/stagioni;
- nuove isole e biomi;
- ricerca tecnologica;
- edifici unici;
- PWA installabile;
- bilanciamento economico su run lunghe.


## Novità v0.5

- UI mobile ridisegnata: testi, pulsanti, pannelli e zolle molto più grandi.
- Zoom iniziale ravvicinato: non tenta più di mostrare tutta l'isola in una volta.
- Quattro attività gratuite con cooldown breve per eliminare i tempi morti:
  - Squadra di raccolta
  - Lavori civici
  - Festa di piazza
  - Recupero costiero
- Eventi toccabili che compaiono direttamente sopra le zolle e danno risorse.
- Città visivamente viva:
  - strade automatiche tra edifici adiacenti
  - abitanti in movimento
  - carri
  - barche ai porti
  - fumo da case e officine
  - raccolti animati
  - pale del mulino
  - indicatori di produzione che salgono dagli edifici
- Migrazione automatica dei salvataggi v0.2.


## UX v0.5

- Barra alta a due livelli con risorse grandi e leggibili.
- Obiettivo integrato nella testata, senza card minuscole sulla mappa.
- Stato città in una sola barra leggibile.
- Camera iniziale ravvicinata e auto-centering sulla città.
- Zolle più grandi su telefono.
- Bottom sheet a due altezze (medio/espanso), con pulsante chiudi separato.
- Informazioni principali ridotte a 3 card grandi: produzione, bonus, stato.
- CTA principali da almeno 50px.
- Costruzione con grandi righe verticali, non phù mini-card orizzontali.
- Se mancano risorse, accesso immediato ai Lavori.
- Salvataggi v0.3 migrati automaticamente.


## Novità v0.5 — Living Production

- Nuova catena alimentare:
  - Fattoria → Grano
  - Mulino → Farina
  - Panificio → Cibo
  - Mercato → Monete
- Catena industriale leggibile:
  - Silvicoltura + Cava → Officina → Merci → Mercato / Porto
- Nuove risorse intermedie: Grano e Farina.
- Nuovo edificio: Panificio.
- Mulino disponibile molto prima nella progressione.
- Missioni iniziali ridisegnate per insegnare le catene.
- Collegamenti produttivi visibili direttamente sulla città:
  - linee di flusso
  - pacchi di risorsa animati fra edifici adiacenti
- Edifici più diversi graficamente:
  - fumo e forno nel Panificio
  - scintille nell’Officina
  - coltivazioni più ricche con i livelli
  - decorazioni aggiuntive ai livelli alti
  - brevi impalcature durante costruzione e upgrade
- Il pannello di una zolla mostra ora chiaramente la sua catena input → output.
- Salvataggi v0.4 migrati automaticamente.
