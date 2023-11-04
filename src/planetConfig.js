
export const innerSolarSystemConfig = [
    { 
      name:'Sun',
      mass: 1.989e30, // Mass of the Sun in kilograms
      distance:0,
      velocity:0,
      color:'yellow'
    },
    {
        name: "Mercury",
        mass: 3.3011e23,
        distance: 0.387, //AU
        velocity: 47.87e3,
        color:'orange'
    },
    {
        name: "Venus",
        mass: 4.8675e24,
        distance: 0.723,
        velocity: 35.02e3,
        color:'yellow'
    },
    {
        name: "Earth",
        mass: 5.97237e24,
        distance: 1,
        velocity: 29.78e3,
        color:'blue'
    },
    {
        name: "Earth's Moon",
        mass: 7.342e22,
        distance: 1.00257, // Slightly more than 1 AU to account for Earth-Moon distance
        velocity: 29.78e3 + 1.022e3, // Earth's velocity + additional Moon's orbital velocity
        color:'gray'
    },
    {
        name: "Mars",
        mass: 6.4171e23,
        distance: 1.524,
        velocity: 24.07e3,
        color:'red'
    }
  ]
  
  export const outerSolarSystemConfig = [
    {
      name: "Jupiter",
      mass: 1.898e27,
      distance: 5.2,
      velocity: 13.07e3,
      color:'brown'
    },
    {
      name: "Io",
      mass: 8.9319e22,
      distance: 5.2 + 0.002821,
      velocity: 13.07e3 + 17.334e3,
      color:'yellow'
    },
    {
      name: "Europa",
      mass: 4.7998e22,
      distance: 5.2 + 0.004486,
      velocity: 13.07e3 + 13.74e3,
      color:'white'
    },
    {
      name: "Ganymede",
      mass: 1.4819e23,
      distance: 5.2 + 0.007155,
      velocity: 13.07e3 + 10.88e3,
      color:'gray'
    },
    {
      name: "Callisto",
      mass: 1.0759e23,
      distance: 5.2 + 0.012585,
      velocity: 13.07e3 + 8.204e3,
      color:'darkgray'
    },
    {
      name: "Saturn",
      mass: 5.683e26,
      distance: 9.5,
      velocity: 9.68e3,
      color:'goldenrod'
    },
    {
      name: "Titan",
      mass: 1.3452e23,
      distance: 9.5 + 0.008168,
      velocity: 9.68e3 + 5.57e3,
      color:'orange'
    },
    {
      name: "Uranus",
      mass: 8.681e25,
      distance: 19.8,
      velocity: 6.81e3,
      color: 'lightblue'
    },
    {
      name: "Neptune",
      mass: 1.024e26,
      distance: 30.1,
      velocity: 5.43e3,
      color: 'blue'
    },
    {
      name: "Pluto",
      mass: 1.30900e22, // Pluto's mass in kilograms
      distance: 39.48, // Average distance to Pluto in AU (varies due to its elliptical orbit)
      velocity: 4.74e3, // Pluto's average orbital velocity in m/s
      color: 'coral' // Arbitrary color choice for Pluto
    }
  ];