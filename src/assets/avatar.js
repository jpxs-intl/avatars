const skinColors = [0xb2725f, 0x90472a, 0xdea18e, 0x65321d, 0xd49975, 0x944d34];
const eyeColors = [0x27130c, 0x4d9ca7, 0x894818, 0x6a8621, 0x869194, 0x3e491d, 0x205083, 0xd19f2d];
const hairColors = [
  0x191514, 0x3d221c, 0x6f3e29, 0xb2621b, 0xe2c564, 0xe25900, 0x4c4b4a, 0xded7d1, 0x1a1f99, 0xb21f9f,
  0x32b2b2, 0x157f09,
];
const casualColors = { red: 0xa71b1f, black: 0x18191a, white: 0xf5f5f5, blue: 0x809bcb };
const teamColors = {
  gdm: { suit: 0xab8554, shirt: 0xe7e7eb, tie: 0xb97418 },
  mon: { suit: 0x06253b, shirt: 0xe7e7eb, tie: 0x126f8e },
  oxs: { suit: 0x565656, shirt: 0xe7e7eb, tie: 0x171919 },
  nex: { suit: 0x737373, shirt: 0xe7e7eb, tie: 0xa20a0a },
  ptc: { suit: 0x171919, shirt: 0xe7e7eb, tie: 0xbcb9b2 },
  meg: { suit: 0x171919, shirt: 0xe7e7eb, tie: null },
};
const equipSuitColors = [0x144060, 0x990c10, 0xe7e7eb];
const rosa = {
  rotate: false,
  antiAliasing: true,
  body: true,
  gender: "m",
  class: 0,
  team: "gdm",
  equipSuit: 0,
  equipNeck: 0,
  head: 1,
  eyeColor: 1,
  hairColor: 1,
  skinColor: 1,
  hair: 1,
  sickoMode: false,
  showHelpers: false,
  wireframe: false,
  embed: true,
  forceView: 0,
  backgroundColor: 0xff7709,
};
const rosaDefaults = JSON.parse(JSON.stringify(rosa));
for (let command of window.location.hash.split(";")) {
  if (command.startsWith("#")) command = command.substring(1);
  const split = command.split("=");
  if (split.length < 2) continue;
  const key = split[0];
  let val = split[1];
  if (rosa[key] != undefined && typeof rosa[key] != "function") {
    if (typeof rosa[key] == "boolean") val = val == "true" ? true : false;
    else val = rosa[key].constructor(val);
    if (typeof val == "number" && Math.floor(val) != val) break;
    let valid = true;
    switch (key) {
      case "gender":
        if (val != "m" && val != "f") valid = false;
        break;
      case "class":
        if (val < 0 || val > 3) valid = false;
        break;
      case "team":
        if (teamColors[val] == undefined) valid = false;
        break;
      case "equipSuit":
        if (val < 0 || val > 3) valid = false;
        break;
      case "equipNeck":
        if (val < 0 || val > 2) valid = false;
        break;
      case "head":
        if (val < 1 || val > 5) valid = false;
        break;
      case "eyeColor":
        if (val < 1 || val > 8) valid = false;
        break;
      case "hairColor":
        if (val < 1 || val > 12) valid = false;
        break;
      case "skinColor":
        if (val < 1 || val > 6) valid = false;
        break;
      case "hair":
        if (val < 1 || val > 9) valid = false;
        break;
      case "forceView":
        if (val < 0 || val > 6) valid = false;
        break;
    }
    if (valid) rosa[key] = val;
    else console.error("Invalid URL argument:", command);
  }
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: rosa.antiAliasing, alpha: true });
const setSize = () => {
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
};
setSize();
renderer.setClearColor(0x000000, 0);
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
window.addEventListener(
  "resize",
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    setSize();
  },
  false
);
const loader = new THREE.GLTFLoader();
const helperGroup = new THREE.Group();
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.position.set(0, 5, 0);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(3, 3, 3);
scene.add(dirLight);
helperGroup.add(new THREE.HemisphereLightHelper(hemiLight));
helperGroup.add(new THREE.DirectionalLightHelper(dirLight));
helperGroup.add(new THREE.AxesHelper(3));
let lastArgumentsTime = 0;
let lastArgumentsTimeout = 0;
function setURLArguments() {
  const now = Date.now();
  if (now - lastArgumentsTime >= 100) {
    lastArgumentsTime = now;
    const args = [];
    for (const key of Object.keys(rosa)) {
      if (typeof rosa[key] == "function" || rosa[key] == rosaDefaults[key]) continue;
      args.push(`${key}=${rosa[key]}`);
    }
    window.location.hash = args.join(";");
  } else {
    clearTimeout(lastArgumentsTimeout);
    lastArgumentsTimeout = setTimeout(setURLArguments, 100 - (now - lastArgumentsTime));
  }
}
loader.load(
  "/internal/avatar/rosa.glb",
  (gltf) => {
    for (let i = gltf.scene.children.length - 1; i >= 0; --i) {
      const mesh = gltf.scene.children[i];
      mesh.material = new THREE.MeshStandardMaterial({ metalness: 0, roughness: 1 });
      scene.add(mesh);
    }
    scene.add(helperGroup);
    console.log(scene, camera);
    let lastCameraType = -1;
    rosa.redraw = () => {
      rosa.class = Number(rosa.class);
      if (!rosa.embed) document.body.style.backgroundColor = "#" + rosa.backgroundColor.toString(16);
      if (rosa.body != lastCameraType) {
        lastCameraType = rosa.body;

        camera.position.set(0, 0, 4);
      }
      const currentHead = `${rosa.gender}head${rosa.head}`;
      const currentHair = `${rosa.gender}hair${rosa.hair}`;
      const currentBody = rosa.class == 0 ? `${rosa.gender}suit1` : `${rosa.gender}casual${rosa.class}`;
      const currentTie = `${rosa.gender}necktie1`;
      const currentTeam = teamColors[rosa.team];
      const currentNecklace = `${rosa.gender}necklace${rosa.equipNeck == 1 ? 1 : 4}`;
      helperGroup.visible = rosa.showHelpers;
      for (const mesh of scene.children) {
        if (mesh.type != "Mesh") continue;
        mesh.visible =
          mesh.name.startsWith(currentHead) ||
          mesh.name == currentHair ||
          (rosa.body &&
            (mesh.name.startsWith(currentBody) ||
              (mesh.name == currentTie && currentTeam.tie != undefined && !rosa.class))) ||
          (rosa.body && rosa.equipNeck > 0 && mesh.name == currentNecklace);
        if (mesh.visible) {
          mesh.material.wireframe = rosa.wireframe;
          switch (mesh.name) {
            case currentHead:
              mesh.material.color.set(skinColors[rosa.skinColor - 1]);
              break;
            case `${currentHead}001`:
              mesh.material.color.set(eyeColors[rosa.eyeColor - 1]);
              break;
            case `${currentHead}002`:
              mesh.material.color.set(0xe0e4e7);
              break;
            case `${currentHead}003`:
            case currentHair:
              mesh.material.color.set(hairColors[rosa.hairColor - 1]);
              break;
            case currentNecklace:
              mesh.material.color.set(0xc39300);
              break;
          }
          if (!rosa.class) {
            switch (mesh.name) {
              case `${currentBody}001`:
                mesh.material.color.set(skinColors[rosa.skinColor - 1]);
                break;
              case currentBody:
                mesh.material.color.set(
                  rosa.equipSuit > 0 ? equipSuitColors[rosa.equipSuit - 1] : currentTeam.suit
                );
                break;
              case `${currentBody}002`:
                mesh.material.color.set(0x2a1b17);
                break;
              case `${currentBody}003`:
                mesh.material.color.set(currentTeam.shirt);
                break;
              case currentTie:
                mesh.material.color.set(currentTeam.tie);
                break;
            }
          } else {
            switch (mesh.name) {
              case currentBody:
                mesh.material.color.set(skinColors[rosa.skinColor - 1]);
                break;
              case `${currentBody}001`:
                mesh.material.color.set(casualColors.red);
                break;
              case `${currentBody}002`:
                mesh.material.color.set(casualColors.black);
                break;
              case `${currentBody}003`:
                mesh.material.color.set(casualColors.white);
                break;
              case `${currentBody}004`:
                mesh.material.color.set(casualColors.blue);
                break;
            }
          }
        }
      }
      if (!rosa.embed) setURLArguments();
    };
    rosa.randomize = () => {
      const teams = ["gdm", "mon", "oxs", "nex", "ptc", "meg"];
      rosa.gender = Math.random() > 0.5 ? "m" : "f";
      rosa.class = Math.random() > 0.5 ? 0 : getRandomInt(1, 4);
      rosa.team = teams[getRandomInt(0, 4)];
      rosa.equipSuit = getRandomInt(0, 4);
      rosa.equipNeck = getRandomInt(0, 3);
      rosa.head = getRandomInt(1, 6);
      rosa.eyeColor = getRandomInt(1, 9);
      rosa.hairColor = getRandomInt(1, 13);
      rosa.skinColor = getRandomInt(1, 7);
      rosa.hair = getRandomInt(1, 10);
      rosa.redraw();
    };
    rosa.redraw();
    document.body.appendChild(renderer.domElement);
    function animate() {
      requestAnimationFrame(animate);
      rosa.forceView = Number(rosa.forceView);
      renderer.render(scene, camera);
    }
    animate();
  },
  undefined,
  console.error
);
