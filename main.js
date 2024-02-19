import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { GUI } from 'dat.gui';
import {keplerOrbitPoints3D, getSpecificAngularMomentum, getTransformPQRtoXYZ} from '/kepler.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);

const renderer = new THREE.WebGLRenderer( {logarithmicDepthBuffer: true} );
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 0, 10000);
camera.lookAt(0, 0, 0);

// create a parent object to assign clickable objects to
const interactables = new THREE.Object3D();
scene.add(interactables);

// Create a cube
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { color: 0x44aa88 } );
const cube = new THREE.Mesh( geometry, material );
//scene.add( cube );


// Create orbit line
// define orbit elements to use
let a = {'Semi-major axis': 5137};
let e = {'Eccentricity': 0.6};
let i = {'Inclination': 0.0};
let w = {'Argument of periapsis': 0.0};
let W = {'Right ascension of the ascending node': 0.0};
let dt = {'Timestep': 1};

let points = keplerOrbitPoints3D(a['Semi-major axis'], e.Eccentricity, 
                                i.Inclination, w['Argument of periapsis'], 
                                W['Right ascension of the ascending node'],
                                398600.4415, dt.Timestep); 

let positions = [];
for (let i = 0; i < points.length; i++) {
    positions.push(points[i].x, points[i].y, points[i].z);
}

const orbitMaterial = new LineMaterial( {color: 0xffffff,
                                        linewidth: 3,
                                        alphaToCoverage: false, 
                                        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)} );

let orbitGeometry = new LineGeometry();
orbitGeometry.setPositions(positions);
let orbitLine = new Line2(orbitGeometry, orbitMaterial);
scene.add(orbitLine);


let lastOrbitTime = Date.now();
let deltaTime = 0;
let timeIndex = 0;
let orbitSpeed = {'Orbit speed': 100};




// Create a sphere to follow orbit
const sphereGeometry = new THREE.SphereGeometry(100);
const sphereMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff} );
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.x = points[0].x;
sphere.position.y = points[0].y;
sphere.position.z = points[0].z;
scene.add(sphere);


// Camera controls
const controls = new TrackballControls( camera, renderer.domElement);
controls.rotateSpeed = 4.0;
controls.update();

// Create axis helper
const originAxis = new THREE.AxesHelper(5000);
originAxis.setColors(0xffffff, 0xffffff, 0xffffff);
scene.add(originAxis);

// Create xy reference plane
const xyPlaneGeometry = new THREE.PlaneGeometry(25000, 25000);
const planeMaterial = new THREE.MeshBasicMaterial(  {color: 0x418dcc, side: THREE.DoubleSide,
                                                     transparent: true, opacity: 0.9} );
const xyPlane = new THREE.Mesh(xyPlaneGeometry, planeMaterial);
xyPlane.name = 'xyPlane';
//xyPlaneGeometry.rotateX(Math.PI/4);
scene.add(xyPlane);


// Create helpful vectors
//
const vectorLength = 2000;
// angular momentum
let hVector = getSpecificAngularMomentum  (a['Semi-major axis'], e.Eccentricity, 
                                            i.Inclination, w['Argument of periapsis'], 
                                            W['Right ascension of the ascending node']);

let hVectorGeometry = new LineGeometry();
const hVectorMaterial = new LineMaterial( {
    color: 0x51ff51,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),   // canvas size
    alphaToCoverage: false,
    linewidth: 3 
});

let hVectorPoints = [];
let hVectorTop = hVector.normalize().multiplyScalar(vectorLength);
hVectorPoints.push(0, 0, 0);
hVectorPoints.push(hVectorTop.x, hVectorTop.y, hVectorTop.z);
hVectorGeometry.setPositions(hVectorPoints);
let hAxis = new Line2(hVectorGeometry, hVectorMaterial);
scene.add(hAxis);

//
// eccentricity vector
let eVectorGeometry = new LineGeometry();
const eVectorMaterial = new LineMaterial( {
    color: 0x5151ff,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),   // canvas size
    alphaToCoverage: false,
    linewidth: 3 
});

let eVectorPoints = [];
let eVectorTop = points[0].normalize().multiplyScalar(vectorLength);
eVectorPoints.push(0, 0, 0);
eVectorPoints.push(eVectorTop.x, eVectorTop.y, eVectorTop.z);
eVectorGeometry.setPositions(eVectorPoints);
let eAxis = new Line2(eVectorGeometry, eVectorMaterial);
scene.add(eAxis);

//
// node vector
let nVectorGeometry = new LineGeometry();
const nVectorMaterial = new LineMaterial( {
    color: 0xff5151,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),   // canvas size
    alphaToCoverage: false,
    linewidth: 3 
});

let nVectorPoints = [];
let nVectorTop = new THREE.Vector3(0, 0, 1).cross(hVector).normalize().multiplyScalar(vectorLength);
nVectorPoints.push(0, 0, 0);
nVectorPoints.push(nVectorTop.x, nVectorTop.y, nVectorTop.z);
nVectorGeometry.setPositions(nVectorPoints);
let nAxis = new Line2(nVectorGeometry, nVectorMaterial);
scene.add(nAxis);


// Create angle visualisations
//
const angleRadius = 1000;
// inclination - between h and Z
let iGeometry = new THREE.CircleGeometry(angleRadius, 50, 0, i.Inclination * Math.PI / 180);
const iAngleMaterial = new THREE.MeshBasicMaterial( {color: 0x51ff51, side: THREE.DoubleSide} );
let iAngle = new THREE.Mesh(iGeometry, iAngleMaterial);
iAngle.name = 'iAngle';
interactables.add(iAngle);

//
// Argument of periapsis - between n and e
let wGeometry = new THREE.CircleGeometry(angleRadius, 50, 0, w['Argument of periapsis'] * Math.PI / 180);
const wAngleMaterial = new THREE.MeshBasicMaterial( {color: 0x5151ff, side: THREE.DoubleSide} );
let wAngle = new THREE.Mesh(wGeometry, wAngleMaterial);
wAngle.name = 'wAngle';
interactables.add(wAngle);

//
// RAAN - between x and n
let WGeometry = new THREE.CircleGeometry(angleRadius, 50, 0, W['Right ascension of the ascending node'] * Math.PI / 180);
const WAngleMaterial = new THREE.MeshBasicMaterial( {color: 0xff5151, side: THREE.DoubleSide} );
let WAngle = new THREE.Mesh(WGeometry, WAngleMaterial);
WAngle.name = 'WAngle';
interactables.add(WAngle);



// Axes labels
// XYZ
const Xmap = new THREE.TextureLoader().load( 'X.png' );
const XspriteMaterial = new THREE.SpriteMaterial( { map: Xmap, sizeAttenuation: false, side: THREE.DoubleSide } );
const Xsprite = new THREE.Sprite(XspriteMaterial);
Xsprite.position.set(5100, 0, 100);
Xsprite.scale.set(0.02, 0.03, 1);
Xsprite.renderOrder = 1;
scene.add( Xsprite );

const Ymap = new THREE.TextureLoader().load( 'Y.png' );
const YspriteMaterial = new THREE.SpriteMaterial( { map: Ymap, sizeAttenuation: false, side: THREE.DoubleSide } );
const Ysprite = new THREE.Sprite(YspriteMaterial);
Ysprite.position.set(0, 5100, 100);
Ysprite.scale.set(0.02, 0.03, 1);
Ysprite.renderOrder = 1;
scene.add( Ysprite );

const Zmap = new THREE.TextureLoader().load( 'Z.png' );
const ZspriteMaterial = new THREE.SpriteMaterial( { map: Zmap, sizeAttenuation: false, side: THREE.DoubleSide } );
const Zsprite = new THREE.Sprite(ZspriteMaterial);
Zsprite.position.set(0, 0, 5100);
Zsprite.scale.set(0.02, 0.03, 1);
Zsprite.renderOrder = 1;
scene.add( Zsprite );

// h, e, n
const hmap = new THREE.TextureLoader().load( 'h.png' );
const hspriteMaterial = new THREE.SpriteMaterial( { map: hmap, sizeAttenuation: false, side: THREE.DoubleSide, color: 0x51ff51 } );
const hsprite = new THREE.Sprite(hspriteMaterial);
hsprite.scale.set(0.03, 0.05, 1);
hsprite.position.set(hVectorTop.x * 1.1, hVectorTop.y * 1.1, hVectorTop.z * 1.1);
hsprite.renderOrder = 1;
hsprite.name = 'hsprite';
interactables.add( hsprite );

const emap = new THREE.TextureLoader().load( 'e.png' );
const espriteMaterial = new THREE.SpriteMaterial( { map: emap, sizeAttenuation: false, side: THREE.DoubleSide, color: 0x5151ff } );
const esprite = new THREE.Sprite(espriteMaterial);
esprite.scale.set(0.03, 0.05, 1);
esprite.position.set(eVectorTop.x * 1.1, eVectorTop.y * 1.1, eVectorTop.z * 1.1);
esprite.renderOrder = 1;
esprite.name = 'esprite';
interactables.add( esprite );

const nmap = new THREE.TextureLoader().load( 'n.png' );
const nspriteMaterial = new THREE.SpriteMaterial( { map: nmap, sizeAttenuation: false, side: THREE.DoubleSide, color: 0xff5151 } );
const nsprite = new THREE.Sprite(nspriteMaterial);
nsprite.scale.set(0.03, 0.05, 1);
nsprite.position.set(nVectorTop.x * 1.1, nVectorTop.y * 1.1, 100);
nsprite.renderOrder = 1;
nsprite.name = 'nsprite';
interactables.add( nsprite );


// See if object clicked then do something
// create raycaster
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let target = null;
let focusedTarget = null;

// add listener for mouse click
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);

function onMouseDown( e ) 
{
    if (e.button != 0) {
        return;
    }

    pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

    // Raycasting
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactables.children, false);
    
    if ( intersects.length > 0 ) {
        if (focusedTarget == null) {
            focusedTarget = intersects[0];
            focusedTarget.object.material.color.add(new THREE.Color(0xa0a0a0));
        } else if (focusedTarget.object.name == intersects[0].object.name) {
            focusedTarget.object.material.color.sub(new THREE.Color(0xa0a0a0));
            focusedTarget = null;
        } else {
            focusedTarget.object.material.color.sub(new THREE.Color(0xa0a0a0));
            focusedTarget = intersects[0];
            focusedTarget.object.material.color.add(new THREE.Color(0xa0a0a0));
        }
    } 
    updateText();
}

function onMouseMove( e )
{
    pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

    // Raycasting
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactables.children, false);

    if (intersects.length > 0) {
        if (target == null) {
            target = intersects[0];
            target.object.material.color.add(new THREE.Color(0x505050));
        }
        if (intersects[0].object.name != target.object.name) {
            target.object.material.color.sub(new THREE.Color(0x505050));
            target = intersects[0];
            target.object.material.color.add(new THREE.Color(0x505050));
        } 
    } else {
        if (target != null) {
            target.object.material.color.sub(new THREE.Color(0x505050));
        }
        target = null;
    }
}


// Create GUI
const gui = new GUI();
const orbitFolder = gui.addFolder('Orbit Elements');
orbitFolder.add(a, 'Semi-major axis', 1000, 10000).onChange(updateOrbit);
orbitFolder.add(e, 'Eccentricity', 0.0, 1.0, 0.01).onChange(updateOrbit);
orbitFolder.add(i, 'Inclination', 0.0, 180.0, 0.01).onChange(updateOrbit);
orbitFolder.add(w, 'Argument of periapsis', 0.0, 360.0, 0.01).onChange(updateOrbit);
orbitFolder.add(W, 'Right ascension of the ascending node', 0.0, 360.0, 0.01).onChange(updateOrbit);
orbitFolder.add(orbitSpeed, 'Orbit speed', 1, 1000, 1).onChange(updateOrbit);
orbitFolder.open();
gui.width = window.innerWidth / 3;

// Text stuff
function updateText()
{
    let focusedTargetHeadingText = "";
    let focusedTargetBodyText = "";

    const deg = "\xB0";
    // omega = \u03C9;
    // OMEGA = \u03A9;

    if (focusedTarget == null) {
        document.getElementById("focusedTargetHeading").innerText = focusedTargetHeadingText;
        document.getElementById("focusedTargetBody").innerText = focusedTargetBodyText;
        return;
    }

    switch (focusedTarget.object.name) {
        case 'iAngle':
            focusedTargetHeadingText = "Inclination, <i>i</i>: ".concat(Math.round(i.Inclination * 100) / 100 + deg);
            focusedTargetBodyText = "Angle between Z axis and specific angular momentum vector <i>h</i>. <br>How much the orbit is rotated about the node vector <i>n</i>.";
            break;
        case 'wAngle':
            focusedTargetHeadingText = "Argument of periapsis,  \u03C9: ".concat(
                                        Math.round(w['Argument of periapsis'] * 100) / 100 + deg);
            focusedTargetBodyText = "Angle between node vector <i>n</i> and eccentricity vector <i>e</i>. <br>How much the orbit is rotated about the <i>h</i> axis.";
            break;
        case 'WAngle':
            focusedTargetHeadingText = "Right ascension of the ascending node,  \u03A9: ".concat(
                                        Math.round(W['Right ascension of the ascending node'] * 100) / 100 + deg);
            focusedTargetBodyText = "Angle between X axis and node vector <i>n</i>. <br>How much the orbit is rotated about the Z axis.";
            break;
        case 'hsprite':
            focusedTargetHeadingText = "Specific angular momentum, <i>h</i> [m<sup>2</sup>s<sup>-1</sup>]";
            focusedTargetBodyText = "The angular momentum of the orbiting body with mass divided out.<br>It is always perpendicular to the orbit plane.";
            break;
        case 'esprite':
            focusedTargetHeadingText = "Eccentricity, <i>e</i> [dimesionless]";
            focusedTargetBodyText = "Eccentricity defines the shape of an orbit. <br>The eccentricity vector points in the direction of periapsis."
            break;
        case 'nsprite':
            focusedTargetHeadingText = "Node vector, <i>n</i>";
            focusedTargetBodyText = "The node vector points toward the ascending node. <br>This is the point where the orbiting body passes up through the XY plane of the central body.";
            break;
        default:
            focusedTargetHeadingText = "";
            focusedTargetBodyText = "";
    }

document.getElementById("focusedTargetHeading").innerHTML = focusedTargetHeadingText;
document.getElementById("focusedTargetBody").innerHTML = focusedTargetBodyText;
}


function updateOrbit()
{
    // Update orbit elements
    points = keplerOrbitPoints3D(a['Semi-major axis'], e.Eccentricity, 
                                i.Inclination, w['Argument of periapsis'], 
                                W['Right ascension of the ascending node'],
                                398600.4415, dt.Timestep); 
    
    positions = [];
    for (let i = 0; i < points.length; i++) {
        positions.push(points[i].x, points[i].y, points[i].z);
    }
    orbitGeometry.dispose();
    scene.remove(orbitLine);
    orbitGeometry = new LineGeometry();
    orbitGeometry.setPositions(positions);
    orbitLine = new Line2(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);

    // Update helpful vectors
    //
    // angular momentum
    let hVector = getSpecificAngularMomentum  (a['Semi-major axis'], e.Eccentricity, 
                                                i.Inclination, w['Argument of periapsis'], 
                                                W['Right ascension of the ascending node']);
    hVectorPoints = [];
    hVectorPoints.push(0, 0, 0);
    hVectorTop = hVector.normalize().multiplyScalar(vectorLength);
    hVectorPoints.push(hVectorTop.x, hVectorTop.y, hVectorTop.z);
    hVectorGeometry.setPositions(hVectorPoints);
    hAxis = new Line2(hVectorGeometry, hVectorMaterial);
    scene.add(hAxis);
    //
    // eccentricity
    eVectorPoints = [];
    eVectorTop = points[0].normalize().multiplyScalar(vectorLength);
    eVectorPoints.push(0, 0, 0);
    eVectorPoints.push(eVectorTop.x, eVectorTop.y, eVectorTop.z);
    eVectorGeometry.setPositions(eVectorPoints);
    eAxis = new Line2(eVectorGeometry, eVectorMaterial);
    scene.add(eAxis);
    //
    // node vector
    nVectorPoints = [];
    nVectorTop = new THREE.Vector3(0, 0, 1).cross(hVector).normalize().multiplyScalar(vectorLength);
    nVectorPoints.push(0, 0, 0);
    nVectorPoints.push(nVectorTop.x, nVectorTop.y, nVectorTop.z);
    nVectorGeometry.setPositions(nVectorPoints);
    nAxis = new Line2(nVectorGeometry, nVectorMaterial);
    scene.add(nAxis);

    // Update angle visualisations
    //
    // rotation matrix
    let angleRotation = new THREE.Matrix4().identity().setFromMatrix3(
        getTransformPQRtoXYZ(i.Inclination,
                w['Argument of periapsis'], 
                W['Right ascension of the ascending node']));

    // inclination
    iGeometry.dispose();
    interactables.remove(iAngle);
    iGeometry = new THREE.CircleGeometry(angleRadius, 50, 0, i.Inclination * Math.PI / 180);
    iGeometry.rotateY(Math.PI/2);
    iGeometry.rotateX(Math.PI);
    iGeometry.rotateZ(W['Right ascension of the ascending node'] * Math.PI / 180);
    iAngle = new THREE.Mesh(iGeometry, iAngleMaterial);
    iAngle.name = 'iAngle';
    interactables.add(iAngle);
    //
    // argument of periapsis
    wGeometry.dispose();
    interactables.remove(wAngle);
    wGeometry = new THREE.CircleGeometry(angleRadius, 50, 0, -w['Argument of periapsis'] * Math.PI / 180);
    wGeometry.applyMatrix4(angleRotation);
    wAngle = new THREE.Mesh(wGeometry, wAngleMaterial);
    wAngle.name = 'wAngle';
    interactables.add(wAngle);
    //
    // RAAN
    WGeometry.dispose();
    interactables.remove(WAngle);
    WGeometry = new THREE.CircleGeometry(angleRadius, 50, 0, W['Right ascension of the ascending node'] * Math.PI / 180);
    WGeometry.translate(0, 0, 5); // help with z fighting on plane
    WAngle = new THREE.Mesh(WGeometry, WAngleMaterial);
    WAngle.name = 'WAngle';
    interactables.add(WAngle);


    // Update text
    updateText();
    hsprite.position.set(hVectorTop.x * 1.1, hVectorTop.y * 1.1, hVectorTop.z * 1.1);
    esprite.position.set(eVectorTop.x * 1.1, eVectorTop.y * 1.1, eVectorTop.z * 1.1);
    nsprite.position.set(nVectorTop.x * 1.1, nVectorTop.y * 1.1, 100);

}



// main loop
function animate() 
{
	requestAnimationFrame( animate );

    controls.update();

    // Advance sphere along orbit
    deltaTime = (Date.now() - lastOrbitTime) / 1000 * orbitSpeed['Orbit speed'];
    timeIndex = Math.floor(deltaTime / dt.Timestep);
    if(timeIndex > points.length - 1) {
        timeIndex = 1;
        lastOrbitTime = Date.now();
    }
    sphere.position.x = points[timeIndex].x;
    sphere.position.y = points[timeIndex].y;
    sphere.position.z = points[timeIndex].z;

    

	renderer.render( scene, camera );
}
animate();
