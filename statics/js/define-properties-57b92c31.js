import{o as f}from"./object-keys-dbad82bd.js";import{d as a}from"./define-data-property-4a458e01.js";import{h as y}from"./has-property-descriptors-568bee55.js";var c=f,u=typeof Symbol=="function"&&typeof Symbol("foo")=="symbol",l=Object.prototype.toString,v=Array.prototype.concat,n=a,m=function(t){return typeof t=="function"&&l.call(t)==="[object Function]"},i=y(),P=function(t,o,e,r){if(o in t){if(r===!0){if(t[o]===e)return}else if(!m(r)||!r())return}i?n(t,o,e,!0):n(t,o,e)},p=function(t,o){var e=arguments.length>2?arguments[2]:{},r=c(o);u&&(r=v.call(r,Object.getOwnPropertySymbols(o)));for(var s=0;s<r.length;s+=1)P(t,r[s],o[r[s]],e[r[s]])};p.supportsDescriptors=!!i;var S=p;export{S as d};