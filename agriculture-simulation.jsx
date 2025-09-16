import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Sprout, Cloud, Droplets, Sun, DollarSign, TrendingUp, Settings, Download, MapPin, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import * as THREE from 'three';

const AgricultureSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('corn');
  const [fieldSize, setFieldSize] = useState(100); // hectares
  const [soilType, setSoilType] = useState('loam');
  const [irrigationType, setIrrigationType] = useState('drip');
  const [fertilizer, setFertilizer] = useState(150); // kg/ha
  const [currentDay, setCurrentDay] = useState(0);
  const [season, setSeason] = useState('spring');
  const [weather, setWeather] = useState({ temp: 22, humidity: 65, rainfall: 0, solar: 850 });
  const [cropData, setCropData] = useState([]);
  const [soilMoisture, setSoilMoisture] = useState(75);
  const [soilNutrients, setSoilNutrients] = useState({ n: 80, p: 60, k: 90 });
  const [pests, setPests] = useState({ level: 0, type: 'none' });
  const [growthStage, setGrowthStage] = useState('germination');
  const [yield, setYield] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [costs, setCosts] = useState(0);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  const crops = {
    corn: { 
      name: 'Corn (Maize)', 
      price: 240, // $/tonne
      expectedYield: 11.5, // tonnes/ha
      growthDays: 120,
      waterRequirement: 500, // mm
      optimalTemp: [20, 30],
      stages: ['germination', 'vegetative', 'flowering', 'grain_filling', 'maturity']
    },
    wheat: { 
      name: 'Winter Wheat', 
      price: 280, 
      expectedYield: 7.2, 
      growthDays: 240,
      waterRequirement: 450,
      optimalTemp: [15, 25],
      stages: ['germination', 'tillering', 'stem_elongation', 'flowering', 'grain_filling', 'maturity']
    },
    soybean: { 
      name: 'Soybean', 
      price: 520, 
      expectedYield: 3.2, 
      growthDays: 100,
      waterRequirement: 400,
      optimalTemp: [20, 28],
      stages: ['germination', 'vegetative', 'flowering', 'pod_development', 'maturity']
    },
    tomato: { 
      name: 'Tomato', 
      price: 1200, 
      expectedYield: 65, 
      growthDays: 90,
      waterRequirement: 600,
      optimalTemp: [18, 26],
      stages: ['germination', 'vegetative', 'flowering', 'fruit_development', 'maturity']
    }
  };

  const soilTypes = {
    clay: { drainage: 0.3, fertility: 0.9, waterHolding: 0.9 },
    loam: { drainage: 0.7, fertility: 0.8, waterHolding: 0.7 },
    sand: { drainage: 0.9, fertility: 0.4, waterHolding: 0.3 },
    silt: { drainage: 0.5, fertility: 0.7, waterHolding: 0.8 }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

  // Initialize 3D farm visualization
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 800 / 500, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(800, 500);
    renderer.setClearColor(0x87CEEB, 1); // Sky blue
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Create terrain
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create crop field grid
    const cropGroup = new THREE.Group();
    const plantGeometry = new THREE.SphereGeometry(0.1, 8, 6);
    
    for (let x = -20; x <= 20; x += 2) {
      for (let z = -20; z <= 20; z += 2) {
        const plantMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.8, 0.6)
        });
        const plant = new THREE.Mesh(plantGeometry, plantMaterial);
        plant.position.set(x + Math.random() * 0.5, 0.1, z + Math.random() * 0.5);
        plant.castShadow = true;
        cropGroup.add(plant);
      }
    }
    scene.add(cropGroup);

    // Add farmhouse
    const houseGeometry = new THREE.BoxGeometry(3, 2, 4);
    const houseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(-30, 1, -30);
    house.castShadow = true;
    scene.add(house);

    // Add roof
    const roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-30, 2.75, -30);
    roof.rotation.y = Math.PI / 4;
    scene.add(roof);

    // Add barn
    const barnGeometry = new THREE.BoxGeometry(6, 4, 8);
    const barnMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    const barn = new THREE.Mesh(barnGeometry, barnMaterial);
    barn.position.set(35, 2, -25);
    barn.castShadow = true;
    scene.add(barn);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    camera.position.set(0, 25, 40);
    camera.lookAt(0, 0, 0);

    sceneRef.current = { scene, camera, renderer, cropGroup };

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Animate crops based on growth
      if (cropGroup && isRunning) {
        const growthFactor = Math.min(currentDay / crops[selectedCrop].growthDays, 1);
        cropGroup.children.forEach((plant, index) => {
          plant.scale.setScalar(0.5 + growthFactor * 2);
          plant.position.y = 0.1 + growthFactor * 0.5;
          
          // Color change based on growth stage
          const hue = 0.25 + growthFactor * 0.1;
          plant.material.color.setHSL(hue, 0.8, 0.6);
        });
      }

      // Animate lighting based on weather
      directionalLight.intensity = 0.4 + (weather.solar / 1000) * 0.6;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRunning, currentDay, selectedCrop, weather.solar]);

  // Simulation loop
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentDay(prev => {
          const newDay = prev + 1;
          const crop = crops[selectedCrop];
          
          // Update season based on day
          const seasonDay = newDay % 365;
          if (seasonDay < 90) setSeason('spring');
          else if (seasonDay < 180) setSeason('summer');
          else if (seasonDay < 270) setSeason('autumn');
          else setSeason('winter');

          // Update weather patterns
          const baseTemp = season === 'summer' ? 28 : season === 'winter' ? 8 : 18;
          const tempVariation = (Math.random() - 0.5) * 10;
          const newTemp = Math.max(0, baseTemp + tempVariation);
          
          const baseRainfall = season === 'summer' ? 2 : season === 'spring' ? 5 : 1;
          const rainfall = Math.random() < 0.3 ? baseRainfall * Math.random() * 3 : 0;
          
          setWeather(prev => ({
            temp: Math.round(newTemp),
            humidity: Math.max(30, Math.min(90, prev.humidity + (Math.random() - 0.5) * 10)),
            rainfall: Math.round(rainfall * 10) / 10,
            solar: Math.max(300, Math.min(1000, 650 + (Math.random() - 0.5) * 300))
          }));

          // Update soil moisture
          setSoilMoisture(prev => {
            const evaporation = (newTemp - 10) * 0.5 + (weather.solar / 1000) * 10;
            const irrigation = irrigationType === 'drip' ? 5 : irrigationType === 'sprinkler' ? 8 : 2;
            const soilDrainage = soilTypes[soilType].drainage * 2;
            
            let newMoisture = prev + rainfall * 5 + irrigation - evaporation - soilDrainage;
            return Math.max(10, Math.min(100, newMoisture));
          });

          // Update soil nutrients
          setSoilNutrients(prev => ({
            n: Math.max(10, prev.n - 0.5 + (fertilizer / 300)),
            p: Math.max(5, prev.p - 0.2 + (fertilizer / 600)),
            k: Math.max(15, prev.k - 0.3 + (fertilizer / 400))
          }));

          // Update growth stage
          const progress = newDay / crop.growthDays;
          const stageIndex = Math.floor(progress * crop.stages.length);
          setGrowthStage(crop.stages[Math.min(stageIndex, crop.stages.length - 1)]);

          // Calculate stress factors
          const tempStress = Math.abs(newTemp - ((crop.optimalTemp[0] + crop.optimalTemp[1]) / 2)) / 10;
          const waterStress = Math.max(0, (60 - soilMoisture) / 60);
          const nutrientStress = Math.max(0, (70 - Math.min(soilNutrients.n, soilNutrients.p, soilNutrients.k)) / 70);
          
          // Update pest pressure
          setPests(prev => {
            const pestPressure = (tempStress + waterStress) * 0.1 + Math.random() * 0.05;
            if (pestPressure > 0.3 && Math.random() < 0.1) {
              const pestTypes = ['aphids', 'spider_mites', 'corn_borer', 'rust', 'blight'];
              return { level: Math.min(100, pestPressure * 100), type: pestTypes[Math.floor(Math.random() * pestTypes.length)] };
            }
            return { level: Math.max(0, prev.level - 2), type: prev.level < 5 ? 'none' : prev.type };
          });

          // Calculate yield
          if (progress >= 1) {
            const stressFactor = 1 - (tempStress + waterStress + nutrientStress) / 3;
            const managementBonus = (fertilizer / 150) * 0.1 + (irrigationType === 'drip' ? 0.15 : irrigationType === 'sprinkler' ? 0.1 : 0);
            const soilBonus = soilTypes[soilType].fertility * 0.2;
            const finalYield = crop.expectedYield * stressFactor * (1 + managementBonus + soilBonus) * (1 - pests.level / 200);
            
            setYield(Math.max(0, finalYield));
            
            // Calculate economics
            const grossRevenue = finalYield * fieldSize * crop.price;
            const seedCost = fieldSize * 50;
            const fertilizerCost = fieldSize * fertilizer * 0.8;
            const irrigationCost = fieldSize * (irrigationType === 'drip' ? 200 : irrigationType === 'sprinkler' ? 150 : 50);
            const pestControlCost = pests.level > 20 ? fieldSize * 80 : 0;
            const laborCost = fieldSize * 300;
            const totalCosts = seedCost + fertilizerCost + irrigationCost + pestControlCost + laborCost;
            
            setRevenue(grossRevenue);
            setCosts(totalCosts);
          }

          // Add data point for charts
          setCropData(prevData => {
            const newDataPoint = {
              day: newDay,
              growth: progress * 100,
              soilMoisture: soilMoisture,
              temperature: newTemp,
              rainfall: rainfall,
              biomass: Math.min(100, progress * 120 * stressFactor),
              pests: pests.level,
              yield: newDay === crop.growthDays ? yield : 0,
              profit: newDay === crop.growthDays ? (revenue - costs) / fieldSize : 0
            };
            
            const updatedData = [...prevData, newDataPoint];
            return updatedData.slice(-100); // Keep last 100 days
          });

          return newDay;
        });
      }, 500); // 500ms per day simulation
    }

    return () => clearInterval(interval);
  }, [isRunning, selectedCrop, soilType, irrigationType, fertilizer, fieldSize, weather, soilMoisture, soilNutrients, pests, yield, revenue, costs]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentDay(0);
    setCropData([]);
    setSoilMoisture(75);
    setSoilNutrients({ n: 80, p: 60, k: 90 });
    setPests({ level: 0, type: 'none' });
    setGrowthStage('germination');
    setYield(0);
    setRevenue(0);
    setCosts(0);
    setSeason('spring');
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Day,Growth(%),Soil_Moisture(%),Temperature(°C),Rainfall(mm),Biomass,Pests(%),Yield(t/ha),Profit($/ha)\n"
      + cropData.map(row => 
        `${row.day},${row.growth},${row.soilMoisture},${row.temperature},${row.rainfall},${row.biomass},${row.pests},${row.yield},${row.profit}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "agriculture_simulation_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentCrop = crops[selectedCrop];
  const progressPercent = Math.min((currentDay / currentCrop.growthDays) * 100, 100);
  const profit = revenue - costs;

  const weatherData = [
    { name: 'Temperature', value: weather.temp, fill: '#ff6b6b' },
    { name: 'Humidity', value: weather.humidity, fill: '#4ecdc4' },
    { name: 'Solar Radiation', value: weather.solar / 10, fill: '#feca57' }
  ];

  const soilData = [
    { name: 'Nitrogen', value: soilNutrients.n, fill: '#26de81' },
    { name: 'Phosphorus', value: soilNutrients.p, fill: '#fc5c65' },
    { name: 'Potassium', value: soilNutrients.k, fill: '#45aaf2' },
    { name: 'Moisture', value: soilMoisture, fill: '#2d98da' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Sprout className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold text-white">High Fidelity Agriculture Simulation</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleSimulation}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause' : 'Start'} Farming</span>
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">Day {currentDay}</span>
              </div>
              <div className="text-2xl font-bold text-white capitalize">{season}</div>
              <div className="text-sm text-gray-400">{growthStage.replace('_', ' ')}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-gray-300 text-sm">Growth</span>
              </div>
              <div className="text-2xl font-bold text-white">{progressPercent.toFixed(1)}%</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-red-400" />
                <span className="text-gray-300 text-sm">Temperature</span>
              </div>
              <div className="text-2xl font-bold text-white">{weather.temp}°C</div>
              <div className="text-sm text-gray-400">Humidity: {weather.humidity}%</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">Soil Moisture</span>
              </div>
              <div className="text-2xl font-bold text-white">{soilMoisture.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Rainfall: {weather.rainfall}mm</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 text-sm">Expected Profit</span>
              </div>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(profit / fieldSize).toFixed(0)}/ha
              </div>
              <div className="text-sm text-gray-400">Yield: {yield.toFixed(1)}t/ha</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-green-400" />
                <h3 className="text-xl font-semibold text-white">Farm Configuration</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Crop Type</label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => {
                      setSelectedCrop(e.target.value);
                      resetSimulation();
                    }}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
                  >
                    {Object.entries(crops).map(([key, crop]) => (
                      <option key={key} value={key}>
                        {crop.name} - ${crop.price}/tonne
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Field Size (hectares): {fieldSize}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={fieldSize}
                    onChange={(e) => setFieldSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
                  >
                    {Object.entries(soilTypes).map(([key, soil]) => (
                      <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} 
                        (Fertility: {(soil.fertility * 100).toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Irrigation System</label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
                  >
                    <option value="rain">Rain Fed</option>
                    <option value="sprinkler">Sprinkler System</option>
                    <option value="drip">Drip Irrigation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fertilizer Application (kg/ha): {fertilizer}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={fertilizer}
                    onChange={(e) => setFertilizer(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Growth Days:</span>
                      <span className="text-white">{currentCrop.growthDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Water Need:</span>
                      <span className="text-white">{currentCrop.waterRequirement}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Pest Level:</span>
                      <span className={`${pests.level > 30 ? 'text-red-400' : 'text-green-400'}`}>
                        {pests.level.toFixed(0)}% ({pests.type})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Farm Visualization */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <Sun className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-semibold text-white">Farm Visualization</h3>
              </div>
              <div ref={mountRef} className="w-full h-96 rounded-lg overflow-hidden bg-sky-200/20" />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-300">Current Weather</div>
                  <div className="text-lg font-bold text-blue-400">
                    <Cloud className="w-4 h-4 inline mr-1" />
                    {weather.rainfall > 0 ? 'Rainy' : 'Clear'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300">Solar Radiation</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {weather.solar} W/m²
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Environmental Conditions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg text-white mb-2">Weather Status</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weatherData}>
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg text-white mb-2">Soil Health</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={soilData}>
                        <PolarGrid stroke="rgba(255,255,255,0.2)" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.5)' }} />
                        <Radar
                          name="Soil Health"
                          dataKey="value"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth and Performance Charts */}
          <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Crop Performance Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg text-white mb-2">Growth Progress & Environmental Factors</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cropData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="growth" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={false}
                        name="Growth (%)"
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="soilMoisture" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                        name="Soil Moisture (%)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={false}
                        name="Temperature (°C)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-lg text-white mb-2">Biomass Accumulation & Stress Factors</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cropData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="biomass" 
                        stackId="1"
                        stroke="#22C55E" 
                        fill="#22C55E"
                        fillOpacity={0.6}
                        name="Biomass"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pests" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={false}
                        name="Pest Pressure (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Economic Analysis */}
          {yield > 0 && (
            <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Harvest Economic Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h4 className="text-lg font-semibold text-green-400 mb-2">Revenue</h4>
                  <div className="text-3xl font-bold text-white">${revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">
                    {yield.toFixed(1)} tonnes/ha × {fieldSize} ha × ${currentCrop.price}/tonne
                  </div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <h4 className="text-lg font-semibold text-red-400 mb-2">Total Costs</h4>
                  <div className="text-3xl font-bold text-white">${costs.toLocaleString()}</div>
                  <div className="text-sm text-gray-300">
                    Seeds + Fertilizer + Irrigation + Labor + Pest Control
                  </div>
                </div>
                <div className={`${profit >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'} rounded-xl p-4 border`}>
                  <h4 className={`text-lg font-semibold mb-2 ${profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>Net Profit</h4>
                  <div className={`text-3xl font-bold ${profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    ${profit.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">
                    ${(profit / fieldSize).toFixed(2)} per hectare
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgricultureSimulation;
