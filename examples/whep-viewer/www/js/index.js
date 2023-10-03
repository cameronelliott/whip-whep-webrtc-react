"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/index.tsx
  var import_client = __require("react-dom/client");

  // ../../dist/WhepViewer.js
  var import_jsx_runtime = __require("react/jsx-runtime");
  var import_react2 = __require("react");

  // ../../dist/common.js
  var import_react = __require("react");

  // ../../node_modules/@cameronelliott/whip-whep/whep.js
  var Extensions = {
    Core: {
      ServerSentEvents: "urn:ietf:params:whep:ext:core:server-sent-events",
      Layer: "urn:ietf:params:whep:ext:core:layer"
    }
  };
  var WHEPClient = class extends EventTarget {
    constructor() {
      super();
      this.iceUsername = null;
      this.icePassword = null;
      this.candidates = [];
      this.endOfcandidates = false;
    }
    async view(pc, url, token) {
      if (this.pc)
        throw new Error("Already viewing");
      this.token = token;
      this.pc = pc;
      pc.onconnectionstatechange = (event) => {
        switch (pc.connectionState) {
          case "connected":
            break;
          case "disconnected":
          case "failed":
            break;
          case "closed":
            break;
        }
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (event.candidate.sdpMLineIndex > 0)
            return;
          this.candidates.push(event.candidate);
        } else {
          this.endOfcandidates = true;
        }
        if (!this.iceTrickeTimeout)
          this.iceTrickeTimeout = setTimeout(() => this.trickle(), 0);
      };
      const offer = await pc.createOffer();
      const headers = {
        "Content-Type": "application/sdp"
      };
      if (token)
        headers["Authorization"] = "Bearer " + token;
      const fetched = await fetch(url, {
        method: "POST",
        body: offer.sdp,
        headers
      });
      if (!fetched.ok)
        throw new Error("Request rejected with status " + fetched.status);
      if (!fetched.headers.get("location"))
        throw new Error("Response missing location header");
      this.resourceURL = new URL(fetched.headers.get("location"), url);
      const links = {};
      if (fetched.headers.has("link")) {
        const linkHeaders = fetched.headers.get("link").split(/,\s+(?=<)/);
        for (const header of linkHeaders) {
          try {
            let rel, params = {};
            const items = header.split(";");
            const url2 = items[0].trim().replace(/<(.*)>/, "$1").trim();
            for (let i = 1; i < items.length; ++i) {
              const subitems = items[i].split(/=(.*)/);
              const key = subitems[0].trim();
              const value = subitems[1] ? subitems[1].trim().replaceAll('"', "").replaceAll("'", "") : subitems[1];
              if (key == "rel")
                rel = value;
              else
                params[key] = value;
            }
            if (!rel)
              continue;
            if (!links[rel])
              links[rel] = [];
            links[rel].push({ url: url2, params });
          } catch (e) {
            console.error(e);
          }
        }
      }
      if (links.hasOwnProperty(Extensions.Core.ServerSentEvents))
        this.eventsUrl = new URL(links[Extensions.Core.ServerSentEvents][0].url, url);
      if (links.hasOwnProperty(Extensions.Core.Layer))
        this.layerUrl = new URL(links[Extensions.Core.Layer][0].url, url);
      if (this.eventsUrl) {
        const events = links[Extensions.Core.ServerSentEvents]["events"] ? links[Extensions.Core.ServerSentEvents]["events"].split(" ") : ["active", "inactive", "layers", "viewercount"];
        const headers2 = {
          "Content-Type": "application/json"
        };
        if (this.token)
          headers2["Authorization"] = "Bearer " + this.token;
        fetch(this.eventsUrl, {
          method: "POST",
          body: JSON.stringify(events),
          headers: headers2
        }).then((fetched2) => {
          if (!fetched2.ok)
            return;
          const sseUrl = new URL(fetched2.headers.get("location"), this.eventsUrl);
          this.eventSource = new EventSource(sseUrl);
          this.eventSource.onopen = (event) => console.log(event);
          this.eventSource.onerror = (event) => console.log(event);
          this.eventSource.onmessage = (event) => {
            console.dir(event);
            this.dispatchEvent(event);
          };
        });
      }
      const config = pc.getConfiguration();
      if ((!config.iceServer || !config.iceServer.length) && links.hasOwnProperty("ice-server")) {
        config.iceServers = [];
        for (const server of links["ice-server"]) {
          try {
            const iceServer = {
              urls: server.url
            };
            for (const [key, value] of Object.entries(server.params)) {
              const cammelCase = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace("-", "").replace("_", ""));
              iceServer[cammelCase] = value;
            }
          } catch (e) {
          }
        }
        if (config.iceServers.length)
          pc.setConfiguration(config);
      }
      const answer = await fetched.text();
      if (!this.iceTrickeTimeout)
        this.iceTrickeTimeout = setTimeout(() => this.trickle(), 0);
      await pc.setLocalDescription(offer);
      this.iceUsername = offer.sdp.match(/a=ice-ufrag:(.*)\r\n/)[1];
      this.icePassword = offer.sdp.match(/a=ice-pwd:(.*)\r\n/)[1];
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
    }
    restart() {
      this.restartIce = true;
      if (!this.iceTrickeTimeout)
        this.iceTrickeTimeout = setTimeout(() => this.trickle(), 0);
    }
    async trickle() {
      this.iceTrickeTimeout = null;
      if (!(this.candidates.length || this.endOfcandidates || this.restartIce) || !this.resourceURL)
        return;
      const candidates = this.candidates;
      let endOfcandidates = this.endOfcandidates;
      const restartIce = this.restartIce;
      this.candidates = [];
      this.endOfcandidates = false;
      this.restartIce = false;
      if (restartIce) {
        this.pc.restartIce();
        const offer = await this.pc.createOffer({ iceRestart: true });
        this.iceUsername = offer.sdp.match(/a=ice-ufrag:(.*)\r\n/)[1];
        this.icePassword = offer.sdp.match(/a=ice-pwd:(.*)\r\n/)[1];
        await this.pc.setLocalDescription(offer);
        endOfcandidates = false;
      }
      let fragment = "a=ice-ufrag:" + this.iceUsername + "\r\na=ice-pwd:" + this.icePassword + "\r\n";
      const transceivers = this.pc.getTransceivers();
      const medias = {};
      if (candidates.length || endOfcandidates)
        medias[transceivers[0].mid] = {
          mid: transceivers[0].mid,
          kind: transceivers[0].receiver.track.kind,
          candidates: []
        };
      for (const candidate of candidates) {
        const mid = candidate.sdpMid;
        const transceiver = transceivers.find((t) => t.mid == mid);
        let media = medias[mid];
        if (!media)
          media = medias[mid] = {
            mid,
            kind: transceiver.receiver.track.kind,
            candidates: []
          };
        media.candidates.push(candidate);
      }
      for (const media of Object.values(medias)) {
        fragment += "m=" + media.kind + " 9 RTP/AVP 0\r\na=mid:" + media.mid + "\r\n";
        for (const candidate of media.candidates)
          fragment += "a=" + candidate.candidate + "\r\n";
        if (endOfcandidates)
          fragment += "a=end-of-candidates\r\n";
      }
      const headers = {
        "Content-Type": "application/trickle-ice-sdpfrag"
      };
      if (this.token)
        headers["Authorization"] = "Bearer " + this.token;
      const fetched = await fetch(this.resourceURL, {
        method: "PATCH",
        body: fragment,
        headers
      });
      if (!fetched.ok)
        throw new Error("Request rejected with status " + fetched.status);
      if (fetched.status == 200) {
        const answer = await fetched.text();
        const iceUsername = answer.match(/a=ice-ufrag:(.*)\r\n/)[1];
        const icePassword = answer.match(/a=ice-pwd:(.*)\r\n/)[1];
        const remoteDescription = this.pc.remoteDescription;
        remoteDescription.sdp = remoteDescription.sdp.replaceAll(/(a=ice-ufrag:)(.*)\r\n/gm, "$1" + iceUsername + "\r\n");
        remoteDescription.sdp = remoteDescription.sdp.replaceAll(/(a=ice-pwd:)(.*)\r\n/gm, "$1" + icePassword + "\r\n");
        await this.pc.setRemoteDescription(remoteDescription);
      }
    }
    async mute(muted) {
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.token)
        headers["Authorization"] = "Bearer " + this.token;
      const fetched = await fetch(this.resourceURL, {
        method: "POST",
        body: JSON.stringify(muted),
        headers
      });
    }
    async selectLayer(layer) {
      if (!this.layerUrl)
        throw new Error("whep resource does not support layer selection");
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.token)
        headers["Authorization"] = "Bearer " + this.token;
      const fetched = await fetch(this.layerUrl, {
        method: "POST",
        body: JSON.stringify(layer),
        headers
      });
    }
    async unselectLayer() {
      if (!this.layerUrl)
        throw new Error("whep resource does not support layer selection");
      const headers = {};
      if (this.token)
        headers["Authorization"] = "Bearer " + this.token;
      const fetched = await fetch(this.layerUrl, {
        method: "DELETE",
        headers
      });
    }
    async stop() {
      if (!this.pc) {
        return;
      }
      this.iceTrickeTimeout = clearTimeout(this.iceTrickeTimeout);
      this.pc.close();
      this.pc = null;
      if (!this.resourceURL)
        throw new Error("WHEP resource url not available yet");
      const headers = {};
      if (this.token)
        headers["Authorization"] = "Bearer " + this.token;
      await fetch(this.resourceURL, {
        method: "DELETE",
        headers
      });
    }
  };

  // ../../dist/common.js
  var debug = (...args) => localStorage.getItem("whep-debug") && console.log(...args);
  var pcConf = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  async function mysleep() {
    debug("-- mysleep");
    const seconds = 3;
    return new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
  }
  function destroyPCRef(ref) {
    debug("-- destroyPCRef");
    if (ref) {
      if (ref.current) {
        ref.current.getTransceivers().forEach((x) => {
          x.stop();
        });
        ref.current.ontrack = null;
        ref.current.oniceconnectionstatechange = null;
        ref.current.onconnectionstatechange = null;
        ref.current.close();
      }
      ref.current = null;
    }
  }
  function useWhepHook(url, token) {
    const [ntries, setNtries] = (0, import_react.useState)(0);
    const [mediaStream, setMediaStream] = (0, import_react.useState)(null);
    const pcref = (0, import_react.useRef)(null);
    const whepRef = (0, import_react.useRef)(null);
    const forceRender = () => setNtries(ntries + 1);
    (0, import_react.useEffect)(() => {
      debug("-- useWhepReceiverHook() useEffect entry live:");
      if (pcref.current === null) {
        pcref.current = new RTCPeerConnection(pcConf);
      }
      if (whepRef.current === null) {
        whepRef.current = new WHEPClient();
      }
      pcref.current.ontrack = (ev) => {
        debug("-- ontrack entry kind: ", ev.track.kind);
        const ms = ev.streams[0];
        if (ms) {
          debug("-- ontrack got stream");
          setMediaStream(ms);
        } else {
          console.warn("-- ontrack empty stream");
        }
      };
      pcref.current.addTransceiver("video", { direction: "recvonly" });
      pcref.current.addTransceiver("audio", { direction: "recvonly" });
      pcref.current.oniceconnectionstatechange = (ev) => {
        const st = ev.target.iceConnectionState;
        debug("-- ice state change", st);
        if (st === "disconnected" || st === "failed" || st === "closed") {
          debug("-- ice state closed/etc, forcing render");
          forceRender();
        }
      };
      if (true) {
        whepRef.current.view(pcref.current, url, token).then(() => {
          debug("-- whep.view() done OK");
        }).catch((err) => {
          debug("-- whep.view() done ERR / sleeping", err);
          mysleep().then(() => {
            debug("-- whep.view() done ERR, forcing render");
            forceRender();
          });
        });
      }
      return () => {
        debug("-- useWhepReceiverHook() useEffect cleanup");
        destroyPCRef(pcref);
        whepRef.current.stop().catch(() => {
          debug("-- whep.stop() done ERR");
        });
      };
    }, [ntries]);
    return [pcref, mediaStream];
  }

  // ../../dist/WhepViewer.js
  function WhepViewer(props) {
    console.log("Entered WhepViewer-nonnative");
    const vidref = (0, import_react2.useRef)(null);
    const [pcref, mediaStream] = useWhepHook(props.url, props.token);
    (0, import_react2.useEffect)(() => {
      if (vidref.current) {
        vidref.current.srcObject = mediaStream;
      }
    }, [mediaStream, vidref]);
    debug("ParentComponent returning JSX");
    if (mediaStream === null) {
      return (0, import_jsx_runtime.jsx)("video", { autoPlay: true, muted: true, controls: true });
    } else {
      return (0, import_jsx_runtime.jsx)("video", { autoPlay: true, muted: true, controls: true, ref: vidref });
    }
  }

  // src/index.tsx
  var import_react5 = __toESM(__require("react"));

  // ../../src/common.ts
  var import_react3 = __toESM(__require("react"), 1);
  var import_react4 = __require("react");

  // src/index.tsx
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  new EventSource("/esbuild").addEventListener("change", () => location.reload());
  function App() {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(WhepViewer, { url: "http://localhost:4000" });
  }
  if (import_react5.default !== import_react3.default) {
    console.warn("Multiple React instances detected!");
  }
  var container = document.getElementById("root");
  var root = (0, import_client.createRoot)(container);
  root.render(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(App, {}));
})();
