import{d as r,r as n,j as e,B as o,f as u}from"./index-D_EtVgJY.js";import{D as h,a as x,b as f,c as p,d as g}from"./dialog-Bp0dwnV9.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=r("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=r("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=r("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function N(){const[t,i]=n.useState(null),l=n.useRef(()=>{}),d=n.useCallback(s=>new Promise(c=>{l.current=c,i({...s,open:!0,resolve:c})}),[]),a=s=>{l.current(s),i(null)},m=t?e.jsx(h,{open:t.open,onOpenChange:s=>{s||a(!1)},children:e.jsxs(x,{className:"max-w-sm",children:[e.jsx(f,{children:e.jsxs("div",{className:"flex items-center gap-3 mb-1",children:[t.variant==="danger"?e.jsx("div",{className:"w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0",children:e.jsx(v,{className:"h-5 w-5 text-destructive"})}):e.jsx("div",{className:"w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0",children:e.jsx(j,{className:"h-5 w-5 text-primary"})}),e.jsx(p,{className:"text-base font-semibold text-foreground leading-tight",children:t.title})]})}),t.description&&e.jsx("p",{className:"text-sm text-muted-foreground px-1 -mt-2",children:t.description}),e.jsxs(g,{className:"flex-row justify-end gap-2 pt-2",children:[e.jsx(o,{variant:"outline",size:"sm",className:"min-w-[80px]",onClick:()=>a(!1),children:t.cancelLabel??"Cancel"}),e.jsx(o,{size:"sm",className:u("min-w-[80px]",t.variant==="danger"?"bg-destructive hover:bg-destructive/90 text-destructive-foreground":""),onClick:()=>a(!0),children:t.confirmLabel??"Confirm"})]})]})}):null;return{confirm:d,ConfirmModalElement:m}}export{k as S,N as u};
