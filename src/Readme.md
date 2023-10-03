# WHEP React Component

**Theory of operation**

- we MUST use useEffect() in order to fully release the PC and the WHEPClient prior to unmount
- we can't simply have those objects dangling around after unmount
- we want the parent to use renders to switch between when video is ready or not: null and non-null media streams
- by using renders to render video elements, we become react native compatible!
