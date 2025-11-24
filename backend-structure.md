
# Taswirar Tsarin Backend (Backend Folder Structure Blueprint)

Wannan fayil ɗin yana bayanin ingantaccen tsarin da za ka bi don gina `backend` mai zaman kansa da Node.js da Express. Wannan tsarin zai taimaka maka ka tsara `code` ɗinka a hanya mai sauƙin fahimta da kulawa.

```
/backend
│
├── src/
│   │
│   ├── api/  (Routes)
│   │   ├── analyze.route.ts       # -> Don /analyze/:symbol
│   │   ├── market.route.ts        # -> Don /scan da /check-trades
│   │   ├── trade.route.ts         # -> Don /trade da /trade-history
│   │   └── payment.route.ts       # -> Don /checkout da /webhook/coinbase
│   │
│   ├── services/  (Business Logic)
│   │   ├── analysis.service.ts    # -> Logic na ainihin aikin AI analysis
│   │   ├── market.service.ts      # -> Logic na scanning da duba trades
│   │   ├── trading.service.ts     # -> Logic na aiwatar da ciniki a Binance
│   │   ├── coinbase.service.ts    # -> Logic na magana da Coinbase Commerce
│   │   └── firestore.service.ts   # -> Ayyukan da suka shafi Firestore
│   │
│   ├── config/
│   │   ├── index.ts               # -> Zai ɗauki dukkan environment variables (API Keys, etc.)
│   │   └── firebase.ts            # -> Saitin Firebase Admin SDK
│   │
│   ├── controllers/
│   │   ├── analysis.controller.ts # -> Zai karɓi kira daga route ya tura zuwa service
│   │   ├── market.controller.ts
│   │   ├── trade.controller.ts
│   │   └── payment.controller.ts
│   │
│   ├── middlewares/
│   │   └── auth.middleware.ts     # -> Zai tabbatar da JWT token na mai amfani
│   │
│   ├── utils/
│   │   ├── crypto.util.ts         # -> Aikin encrypt da decrypt (daga user-profile.ts)
│   │   └── indicators.util.ts     # -> Lissafin technical indicators
│   │
│   └── app.ts                     # -> Babban fayil na Express app
│
├── package.json
├── tsconfig.json
└── .env
```

### Bayanin Kowanne Babban Fayil:

1.  **/src/api (Routes):**
    *   **Aiki:** Wannan shine ƙofar shiga `backend` ɗinka. Kowanne fayil a nan zai ayyana hanyoyin API (kamar `/scan`, `/trade`). Aikinsa kawai shine ya karɓi kira daga `frontend` ya tura zuwa `controller` da ya dace.
    *   **Misali:** A `market.route.ts`, za ka ayyana `router.get('/scan', marketController.scanMarket)`.

2.  **/src/controllers:**
    *   **Aiki:** Waɗannan sune masu kula da kira. Suna karɓar buƙata (`request`) daga `route`, su ciro bayanan da ake buƙata (kamar `userId` ko `symbol`), sannan su kira `service` da ya dace don ainihin aikin.

3.  **/src/services (Business Logic):**
    *   **Aiki:** Wannan shine zuciyar `backend` ɗinka. A nan ne dukkan ainihin ayyuka suke faruwa. Misali, `market.service.ts` zai ƙunshi ainihin `code` ɗin da ke zuwa Binance ya janyo bayanai, ya yi amfani da `indicators` don ya nemo damarmakin ciniki.

4.  **/src/middlewares:**
    *   **Aiki:** `auth.middleware.ts` zai zama mai gadi. Kafin a aiwatar da kowane aiki mai muhimmanci, wannan `middleware` ɗin zai duba `JWT token` da `frontend` ya aiko don ya tabbatar da cewa mai amfani na gaske ne kuma yana da izini.

5.  **/src/utils:**
    *   **Aiki:** Wannan wurin ajiyar ƙananan ayyuka ne da ake amfani da su a wurare daban-daban. Lissafin `RSI` da `MACD` zasu kasance a `indicators.util.ts`.

6.  **/src/config:**
    *   **Aiki:** Wurin da za ka adana dukkan saituna, musamman kalmomin sirri na API (`API Keys`) da haɗin Firebase Admin SDK.

### Yadda Zaka Fara:

1.  **Kafa Aikin:** Ƙirƙiri sabon babban fayil (`folder`) don `backend` ɗinka, ka shiga ciki, sannan ka gudanar da `npm init -y` da `npm install express typescript @types/node @types/express --save`.
2.  **Tsara Fayiloli:** Ka bi taswirar da ke sama don ƙirƙirar manyan fayiloli da fayiloli.
3.  **Cika Fayilolin:** Ka fara ɗauko `code` daga fayilolin `src/app/api/...` na wannan aikin ka rarraba su a cikin sabbin fayilolin `service` ɗinka. Misali, `code` na `scan/route.ts` zai shiga cikin `market.service.ts`.

Ta bin wannan tsarin, za ka gina `backend` mai tsafta, mai sauƙin gyara, kuma mai shirye don girma a nan gaba.
