/*
Return an array of 3D points over time solving a particular orbit
*/

import * as THREE from 'three';


// Transformation matrices
function R1 (a)
{
    const R1 = new THREE.Matrix3();
    R1.set( 1,  0,              0,
            0,  Math.cos(a),    Math.sin(a),
            0,  -Math.sin(a),   Math.cos(a));
    return R1;
}

function R2 (a)
{
    const R2 = new THREE.Matrix3();
    R2.set( Math.cos(a),    0,   -Math.sin(a),
            0,              1,   0,
            Math.sin(a),    0,   Math.cos(a));
    return R2;
}

function R3 (a)
{
    const R3 = new THREE.Matrix3();
    R3.set( Math.cos(a),    Math.sin(a),    0,
            -Math.sin(a),   Math.cos(a),    0,
            0,              0,              1);
    return R3;
}

function deg2rad(angle) 
{
    return angle * Math.PI / 180;
}

export function keplerOrbitPoints3D(a, e, i=0, w=0, W=0, mu=398600.4415, dt=10, tol=0.001)
{
    // Basic orbit information
    const rp = a*(1-e);            // [km]
    const ra = a*(1+e);            // [km]
    const h = Math.sqrt(mu*a*(1-e**2));  // specific angular momentum [m^2/s]
    const n = Math.sqrt(mu/a**3);        // mean motion [rad/s]
    const T = 2*Math.PI*Math.sqrt(a**3/mu);   // period [s]

    // Solve Kepler's equation: M = E - esinE

    const pointsPQR = [];  // p,q,r points on orbit
    const pointsXYZ = [];  // x,y,z points on orbit

    let f = 0;   // true anomaly (theta) [rad]
    let rMagnitude = 0; // radius magnitude at each timestep
    let M = 0;
    let error = 1;
    let previousE = 0;
    let E = M;  // inital choice of E

    for (let t = 0; t <= T; t += dt) {

        M = n * t;  // mean anomaly [rad]
        error = 1;  // large initial error in E solution

        while (error > tol) {
            previousE = E;
            E = E + (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
            error = Math.abs(previousE - E);
        }
        f = 2 * Math.atan(Math.sqrt((1+e)/(1-e))*Math.tan(E/2));  // Solve found E for true anomaly, f
        rMagnitude = (h * h / mu) / (1 + e * Math.cos(f));
        pointsPQR.push( new THREE.Vector3(rMagnitude * Math.cos(f), rMagnitude * Math.sin(f), 0) );
    }

    // Transform points to 3D based on orbital elements
    let T_pqw_xyz = R3(-deg2rad(W));
    T_pqw_xyz.multiply(R1(-deg2rad(i)));
    T_pqw_xyz.multiply(R3(-deg2rad(w)));
    //console.log(T_pqw_xyz.elements);
    let pointMatrix = new THREE.Matrix3();

    for (let i = 0; i < pointsPQR.length; i++) {
        pointMatrix.set(    pointsPQR[i].x, 0, 0,
                            pointsPQR[i].y, 0, 0,
                            pointsPQR[i].z, 0, 0);
        
        pointMatrix.premultiply(T_pqw_xyz);
        pointsXYZ.push( new THREE.Vector3(pointMatrix.elements[0], pointMatrix.elements[1], pointMatrix.elements[2]) );
    }

    // Return XYZ frame points
    return pointsXYZ;

}

export function getSpecificAngularMomentum (a, e, i, w, W, mu=398600.4415)
{
    let hMatrix = new THREE.Matrix3();

    hMatrix.set(0, 0, 0,
                0, 0, 0,
                Math.sqrt(mu*a*(1-e**2)), 0, 0);
    
    let T_pqw_xyz = R3(-deg2rad(W));
    T_pqw_xyz.multiply(R1(-deg2rad(i)));
    T_pqw_xyz.multiply(R3(-deg2rad(w)));

    hMatrix.premultiply(T_pqw_xyz);

    return new THREE.Vector3(hMatrix.elements[0], hMatrix.elements[1], hMatrix.elements[2]);
}

export function getTransformPQRtoXYZ(i, w, W)
{
    let T_pqw_xyz = R3(-deg2rad(W));
    T_pqw_xyz.multiply(R1(-deg2rad(i)));
    T_pqw_xyz.multiply(R3(-deg2rad(w)));

    return T_pqw_xyz;
}