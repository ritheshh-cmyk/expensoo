import{d as o,r as n,j as e,B as c,g as u}from"./index-C-yJaz0F.js";import{D as x,a as f,b as h,c as p,d as g}from"./dialog-bhh1VXPw.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=o("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=o("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);function k(){const[t,r]=n.useState(null),i=n.useRef(()=>{}),d=n.useCallback(s=>new Promise(l=>{i.current=l,r({...s,open:!0,resolve:l})}),[]),a=s=>{i.current(s),r(null)},m=t?e.jsx(x,{open:t.open,onOpenChange:s=>{s||a(!1)},children:e.jsxs(f,{className:"max-w-sm",children:[e.jsx(h,{children:e.jsxs("div",{className:"flex items-center gap-3 mb-1",children:[t.variant==="danger"?e.jsx("div",{className:"w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0",children:e.jsx(v,{className:"h-5 w-5 text-destructive"})}):e.jsx("div",{className:"w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0",children:e.jsx(j,{className:"h-5 w-5 text-primary"})}),e.jsx(p,{className:"text-base font-semibold text-foreground leading-tight",children:t.title})]})}),t.description&&e.jsx("p",{className:"text-sm text-muted-foreground px-1 -mt-2",children:t.description}),e.jsxs(g,{className:"flex-row justify-end gap-2 pt-2",children:[e.jsx(c,{variant:"outline",size:"sm",className:"min-w-[80px]",onClick:()=>a(!1),children:t.cancelLabel??"Cancel"}),e.jsx(c,{size:"sm",className:u("min-w-[80px]",t.variant==="danger"?"bg-destructive hover:bg-destructive/90 text-destructive-foreground":""),onClick:()=>a(!0),children:t.confirmLabel??"Confirm"})]})]})}):null;return{confirm:d,ConfirmModalElement:m}}export{k as u};
