import{d,r as t}from"./index-BOs88oDq.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=d("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);var h=globalThis!=null&&globalThis.document?t.useLayoutEffect:()=>{};function v(r){const[e,o]=t.useState(void 0);return h(()=>{if(r){o({width:r.offsetWidth,height:r.offsetHeight});const f=new ResizeObserver(s=>{if(!Array.isArray(s)||!s.length)return;const n=s[0];let i,u;if("borderBoxSize"in n){const c=n.borderBoxSize,a=Array.isArray(c)?c[0]:c;i=a.inlineSize,u=a.blockSize}else i=r.offsetWidth,u=r.offsetHeight;o({width:i,height:u})});return f.observe(r,{box:"border-box"}),()=>f.unobserve(r)}else o(void 0)},[r]),e}function y(r){const e=t.useRef({value:r,previous:r});return t.useMemo(()=>(e.current.value!==r&&(e.current.previous=e.current.value,e.current.value=r),e.current.previous),[r])}export{z as C,v as a,y as u};
