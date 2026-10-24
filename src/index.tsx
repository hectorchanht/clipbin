import { ColorModeScript } from "@chakra-ui/react"
import * as React from "react"
import ReactDOM from "react-dom"
import { App } from "./App"
import "./index.css"
import { initAnalytics } from "./libs/analytics"
import reportWebVitals from "./reportWebVitals"

// PostHog product analytics — browser-only init (the module guards itself).
initAnalytics()

const WELCOME_MESSAGE = `
██████╗ ██╗   ██╗███████╗██╗  ██╗
██╔══██╗██║   ██║██╔════╝██║  ██║
██████╔╝██║   ██║███████╗███████║
██╔══██╗██║   ██║╚════██║██╔══██║
██║  ██║╚██████╔╝███████║██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
      ██████╗ ██╗███╗   ██╗      
      ██╔══██╗██║████╗  ██║      
█████╗██████╔╝██║██╔██╗ ██║█████╗
╚════╝██╔══██╗██║██║╚██╗██║╚════╝
      ██████╔╝██║██║ ╚████║      
      ╚═════╝ ╚═╝╚═╝  ╚═══╝      


https://github.com/hectorchanht/rushbin-clipboard
`;

ReactDOM.render(
  <React.StrictMode>
    <ColorModeScript />
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
)

// The PWA service worker (/sw.js in public/) is registered from
// public/index.html. The CRA template's serviceWorker.unregister() call was
// removed so it doesn't unregister that worker on every boot.

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
console.log(WELCOME_MESSAGE);
reportWebVitals()
