import { SvgScreenFrame } from './SvgScreenFrame';
﻿export default function ErrorPage() {
  return <SvgScreenFrame screen={'error'}><main className="error-screen screen-enter"><img src="/images/NewLogo.svg" alt="YEMUNNAI"/><span className="error-code">404</span><h1>Page not found</h1><p>This page is unavailable.<br/>Return to the menu or try again.</p><div className="error-actions"><a href="/">Back to menu</a><button type="button" onClick={()=>window.location.reload()}>Try again</button></div><div className="error-shortcuts"><a href="/">Meals</a><a href="/">Tea and snacks</a><a href="/">Canteens</a></div></main></SvgScreenFrame>;
}
