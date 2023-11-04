import { innerSolarSystemConfig, outerSolarSystemConfig } from "./src/planetConfig";

document.body.insertAdjacentHTML('afterbegin',`
    <canvas id="solarSystem" width="800" height="800"></canvas>
`);

const canvas = document.getElementById('solarSystem');
const ctx = canvas.getContext('2d');

// Constants
const G = 6.67430e-11; // Gravitational constant
const timeStep = 3600; // One hour in seconds
const AU = 1.496e11; // One Astronomical Unit (distance from Earth to Sun) in meters


// Add a rocket object. The rocket won't attract planets but will be attracted, so mass can be arbitrary to increase gravity
const SaturnV = {
    mass: 480000, // Arbitrary mass of the rocket in kilograms
    x: 0, // Initial X position will be set based on Earth's position
    y: 0, // Initial Y position will be set based on Earth's position
    vx: 0, // Initial X velocity of the rocket
    vy: 0, // Initial Y velocity of the rocket
    fx: 0, // Force applied in the X direction
    fy: 0, // Force applied in the Y direction
    color: 'red'
};
const rocketInitialImpulse = 3e4; // Arbitrary large number for noticeable effect, this is multiplied over timeStep (e.g. 1Hr)
let rocketLaunched = false;

/** e.g.
 * planet: {
 *  name:'Eeyarth'
 *  mass:3e23,
 * 
 *  distance:1, 
 *    //OR
 *  x: 1.2*AU,
 *  y: 0.5*AU,
 * 
 *  velocity: 47.87e3,
 *    //OR
 *  velocityX:50e3,
 *  velocityY:20e2,
 * 
 *  color:'blue'
 * }
 * 
 */

// Solar system planets configurations
const solarSystemConfig = [
  //inner planets and moon
  ...innerSolarSystemConfig,
  // Outer planets and their moons
  ...outerSolarSystemConfig
  // Add other planets if needed
];

// Generate the planets
const SolarSystem = generateSolarSystem(solarSystemConfig);
  
// Find the largest body to exclude it from the exaggeration
const largestBody = SolarSystem.reduce((prev, current) => (prev.mass > current.mass) ? prev : current);
  
// Find the farthest planet to set the scale factor accordingly
let scaleFactor, logf, orbitExaggerationFactor=100;
const farthestPlanetDistance = Math.max(...solarSystemConfig.map(config => Math.abs(config.distance)));
const farthestPlanetDistanceM = farthestPlanetDistance*AU;

let mouseX, mouseY;
const timeSimulation = 300*timeStep; // nSteps

canvas.addEventListener('mousemove',(ev)=>{
    const rect = canvas.getBoundingClientRect();
    mouseX = ev.clientX - rect.left - canvas.width / 2;
    mouseY = ev.clientY - rect.top - canvas.height / 2;
});

function generateSolarSystem(planetConfigs) {
  return planetConfigs.map(config => ({
    name: config.name,
    mass: config.mass,
    x: config.x ? config.x : config.distance * AU, //provide x and y in meters or distance in AU
    y: config.y ? config.y : config.distanceY ? config.distanceY : 0,
    vx: config.velocityX ? config.velocityX : 0,
    vy: config.velocity ? config.velocity : config.velocityY ? config.velocityY : 0,
    color:config.color
  }));
}


function distanceEasing(distanceFromCenter,sf=scaleFactor) {
  const logDistance = distanceFromCenter > 1 ? Math.pow(
    distanceFromCenter*logf*sf, 
    (0.55 + (farthestPlanetDistance*0.0025)*(1-(distanceFromCenter/farthestPlanetDistanceM)))
  ) : 0; // Avoid log(0) by adding 1
  return logDistance
}

function drawBody(ctx, bodyX, bodyY, mass, canvasWidth, canvasHeight, color) {
  const angle = Math.atan2(bodyY, bodyX);
  // Apply an exponential/logarithmic transformation to the distances from the center
  const distanceFromCenter = Math.sqrt(bodyX * bodyX + bodyY * bodyY);
  const logDistance = distanceEasing(distanceFromCenter);
  const screenX = (canvasWidth / 2) + Math.cos(angle) * scaleFactor * logDistance;
  const screenY = (canvasHeight / 2) + Math.sin(angle) * scaleFactor * logDistance;

  let scaled = Math.log10(mass)*0.10; //arbitrary logarithmic scaling factor for planet radii
  const planetRadius = Math.pow(scaled, scaled)*.4; 
  ctx.beginPath();
  ctx.arc(screenX, screenY, planetRadius, 0, Math.PI * 2);
  ctx.fillStyle = color ? color : 'gray';
  ctx.fill();
}


function drawSystem(
  planets=SolarSystem, 
  rocket=SaturnV,
  dt=timeStep
) {
    if (!scaleFactor) {
      // The maximum distance we expect to encounter in the system, which will be scaled down to fit the canvas
      const maxExpectedDistance = Math.log10(farthestPlanetDistance * AU + 1);
      console.log(maxExpectedDistance);
      scaleFactor = Math.min(canvas.width, canvas.height) / (2 * maxExpectedDistance);
      logf = 1/((farthestPlanetDistance+farthestPlanetDistanceM)*0.5);
      orbitExaggerationFactor = (farthestPlanetDistance > scaleFactor ? scaleFactor*3.33 : farthestPlanetDistance*10); 
            
    }
  
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  
    // Draw the planets
    planets.forEach(planet => {
    
        let exaggeratedX = planet.x;
        let exaggeratedY = planet.y;
    
        if (planet !== largestBody && planet.mostInfluentialBody && planet.mostInfluentialBody !== largestBody) {
            const dx = planet.x - planet.mostInfluentialBody.x;
            const dy = planet.y - planet.mostInfluentialBody.y;
            exaggeratedX = planet.mostInfluentialBody.x + dx * orbitExaggerationFactor;
            exaggeratedY = planet.mostInfluentialBody.y + dy * orbitExaggerationFactor;
            planet.exaggeratedX = exaggeratedX;
            planet.exaggeratedY = exaggeratedY;
        }

        drawBody(
          ctx, 
          exaggeratedX, 
          exaggeratedY, 
          planet.mass, 
          canvas.width, 
          canvas.height, 
          planet.color
        );

        if(mouseX && mouseY && planet.name === 'Earth') {
            // Draw a computed trajectory from Earth based on mouse direction
            // Calculate the direction of the force based on mouse position
            const angle = Math.atan2(mouseY, mouseX);

            // Create a simulated rocket with initial position and velocity based on mouse position
            let simulatedRocket = {
                x: planet.x + Math.cos(angle) * planet.x * 0.2,
                y: planet.y + Math.sin(angle) * planet.y * 0.2,
                vx: planet.vx, // Initial velocity based on mouse position
                vy: planet.vy, // Divide to scale the velocity
                mass: rocket.mass
            };

            // Apply the initial force direction to the rocket for trajectory simulation
            let vScalar = rocketInitialImpulse * dt * dt / simulatedRocket.mass;
            simulatedRocket.vx += Math.cos(angle) * vScalar; //rocket thrust endures for a whole timeStep
            simulatedRocket.vy += Math.sin(angle) * vScalar;

            const distanceFromCenter = Math.sqrt(simulatedRocket.x ** 2 + simulatedRocket.y ** 2);
            const logDistance = distanceEasing(distanceFromCenter);
      
            let simRocketAngle = Math.atan2(simulatedRocket.y, simulatedRocket.x);

            // Convert polar coordinates to Cartesian coordinates for the trajectory point
            let simRocketScreenX = (canvas.width / 2) + Math.cos(simRocketAngle) * logDistance * scaleFactor;
            let simRocketScreenY = (canvas.height / 2) + Math.sin(simRocketAngle) * logDistance * scaleFactor;
            // Draw the trajectory
            ctx.beginPath();
            // Start at the rocket's current location on the screen, not at the exaggerated position
            ctx.moveTo(simRocketScreenX, simRocketScreenY);

            let ssClone = structuredClone(planets); //clone the planet object so we can project trajectories forward
            for (let t = 0; t < timeSimulation; t += dt) {
              updateSystem(ssClone, simulatedRocket, dt);
              const distanceFromCenter = Math.sqrt(simulatedRocket.x ** 2 + simulatedRocket.y ** 2);
              const logDistance = distanceEasing(distanceFromCenter);
        
              let simRocketAngle = Math.atan2(simulatedRocket.y, simulatedRocket.x);

              // Convert polar coordinates to Cartesian coordinates for the trajectory point
              let simRocketScreenX = (canvas.width / 2) + Math.cos(simRocketAngle) * logDistance * scaleFactor;
              let simRocketScreenY = (canvas.height / 2) + Math.sin(simRocketAngle) * logDistance * scaleFactor;
              
              ctx.lineTo(simRocketScreenX, simRocketScreenY);
            }

            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1;
            ctx.stroke();

        }

    });

    
    // Draw the rocket as a triangle
    if (rocketLaunched) {
        // Apply the same logarithmic scaling for the rocket
        const distanceFromCenter = Math.sqrt(rocket.x ** 2 + rocket.y ** 2);
        const logDistance = distanceEasing(distanceFromCenter);
        const angle = Math.atan2(rocket.y, rocket.x);
        const rocketX = (canvas.width / 2) + (Math.cos(angle) * logDistance * scaleFactor);
        const rocketY = (canvas.height / 2) + (Math.sin(angle) * logDistance * scaleFactor);
        const vangle = Math.atan2(rocket.vy, rocket.vx); // Direction of the velocity vector
        const size = 7; // Size of the triangle representing the rocket

        // Calculate the tip of the rocket
        const tipX = rocketX + size * Math.cos(vangle);
        const tipY = rocketY + size * Math.sin(vangle);

        // Calculate the back corners of the rocket
        const rearLeftX = rocketX - size * (Math.cos(vangle) - 0.5 * Math.sin(vangle));
        const rearLeftY = rocketY - size * (Math.sin(vangle) + 0.5 * Math.cos(vangle));
        const rearRightX = rocketX - size * (Math.cos(vangle) + 0.5 * Math.sin(vangle));
        const rearRightY = rocketY - size * (Math.sin(vangle) - 0.5 * Math.cos(vangle));

        ctx.beginPath();
        ctx.moveTo(tipX, tipY); // Move to the tip of the triangle
        ctx.lineTo(rearLeftX, rearLeftY); // Draw line to the rear left of the triangle
        ctx.lineTo(rearRightX, rearRightY); // Draw line to the rear right of the triangle
        ctx.closePath(); // Close the path to create the third side of the triangle
        ctx.fillStyle = SaturnV.color;
        ctx.fill();
    } else {

    }
}


function updateSystem(
  planets=SolarSystem, 
  rocket=SaturnV,
  dt=timeStep,
  mainBody=largestBody
) {
    // Variables to calculate center of mass
    let totalMass = 0;
    let weightedX = 0;
    let weightedY = 0;
    let mainBodyMassLog;
  
    if (rocket) {
        // Reset forces on the rocket
        rocket.fx = 0;
        rocket.fy = 0;
        mainBodyMassLog = Math.log(Math.log(mainBody.mass));
    }
  
    // Calculate the gravitational force between all pairs of bodies
    for (let i = 0; i < planets.length; i++) {
        const planetA = planets[i];
        planetA.maxForce = 0;
        for (let j = 0; j < planets.length; j++) {
            if (i === j) continue; // Skip self
    
            const planetB = planets[j];
    
            const dx = planetA.x - planetB.x;
            const dy = planetA.y - planetB.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance === 0) throw new Error('Collision detected between ' + planetA.name + ' and ' + planetB.name);
    
            const force = (G * planetB.mass) / (distance * distance);
    
            // Update max force and most influential body for planet A
            if (
                force > planetA.maxForce || 
                (planetB !== mainBody && force > planetA.maxForce*0.25) //prefer nearby bodies (i.e. moons to planets to exaggerate orbits)
            ) {
                planetA.maxForce = force;
                planetA.mostInfluentialBody = planetB;
            }
    
            // Assuming the force is mutual, we don't need to update for planet B
            // as it will be handled in its own turn in the outer loop
    
            const ax = force * dx / distance;
            const ay = force * dy / distance;
    
            // Update velocities of planetA based on the force exerted by planetB
            planetA.vx -= ax * dt;
            planetA.vy -= ay * dt;
        }
        // Update the mass and weighted position for center of mass calculation
        totalMass += planetA.mass;
        weightedX += planetA.x * planetA.mass;
        weightedY += planetA.y * planetA.mass;
    
        // Now that we have checked all other bodies, planetA knows its most influential body
        // You can perform additional logic here using planetA.mostInfluentialBody if needed

        if(rocket) {
        
          //let's use exaggerated orbits 
            const dx = rocket.x - (planetA.exaggeratedX ? planetA.exaggeratedX : planetA.x);
            const dy = rocket.y - (planetA.exaggeratedY ? planetA.exaggeratedY : planetA.y);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) continue; // Avoid self-interaction or collision

            const force = (G * planetA.mass) / (
              Math.pow( //this is just to make it more fun rather than be accurate
                distance,
                (1.98 - (planetA.mass < mainBody.mass ? 3*(mainBodyMassLog-Math.log(Math.log(planetA.mass))
              ) : 0)))
            );
            // Calculate the acceleration of the rocket due to planet's gravity
            const ax = force * dx / distance; //mass cancelled out already
            const ay = force * dy / distance;

            // Update the force vectors for the rocket
            rocket.vx -= ax * dt;
            rocket.vy -= ay * dt;

            //dumb hit check
            if(rocket === SaturnV && distance < (0.02*AU)) {
              console.log('Rocket hit', planetA.name);
              rocketLaunched = false; //hit!
            }

        }
    }
  
    // Update the positions of all planets based on their updated velocities
    planets.forEach(planet => {
      planet.x += planet.vx * dt;
      planet.y += planet.vy * dt;
    });
  
    // Calculate center of mass
    const centerX = weightedX / totalMass;
    const centerY = weightedY / totalMass;


    if (rocket) {
        // Update the velocity and position of the rocket based on the accumulated force
        rocket.x += rocket.vx * dt;
        rocket.y += rocket.vy * dt;
    }

  
    // Optionally, use the center of mass to perform system-wide operations
  
    // Return the center of mass (if needed elsewhere)
    return { x: centerX, y: centerY }; //returns the barycenter of all the moving bodies
}
    

function animate() {
    updateSystem(SolarSystem, rocketLaunched ? SaturnV : null, timeStep, largestBody); // Update the system based on physics
    drawSystem(); // Draw the system with scaling applied
    requestAnimationFrame(animate); // Call the next frame
}
  
animate(); // Start the animation




// Function to apply the force to the rocket based on mouse position
function applyForceToRocket(event) {
        // Calculate the direction of the force based on mouse position
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - canvas.width / 2;
        const mouseY = event.clientY - rect.top - canvas.height / 2;

        // This is an arbitrary force calculation for the mouse interaction
        const angle = Math.atan2(mouseY, mouseX);
   
        // Set the initial position and velocity of the rocket to be near Earth
        const earth = SolarSystem.find(planet => planet.name === "Earth");
        if (earth) {
            SaturnV.x = earth.x + Math.cos(angle) * earth.x * 0.2;
            SaturnV.y = earth.y + Math.sin(angle) * earth.y * 0.2;
            SaturnV.vx = earth.vx;
            SaturnV.vy = earth.vy;
        }
        
        // Apply force in the direction of the mouse click
        const vScalar = rocketInitialImpulse * timeStep * timeStep / SaturnV.mass;
        SaturnV.vx += Math.cos(angle) * vScalar;
        SaturnV.vy += Math.sin(angle) * vScalar;

        rocketLaunched = true;

        console.log('launched!')
}

// Listen for mouse clicks on the canvas to trigger the rocket force application
canvas.addEventListener('click', applyForceToRocket);
