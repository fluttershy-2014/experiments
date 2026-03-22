import * as THREE from 'three';
import { Neko } from './neko.js';
import { World } from './world.js';
import { Ending } from './ending.js';
import { StartMenu } from './start.js';

// ФОНОВАЯ МУЗЫКА
const bgMusic = new Howl({
    src: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'],
    autoplay: false, 
    loop: true,
    volume: 0.1
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
scene.fog = new THREE.Fog(0x020205, 10, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ограничение для 4K мониторов, чтобы не лагало
document.body.appendChild(renderer.domElement);

// --- СОЗДАНИЕ ЗВЕЗДНОГО ФОНА ---
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        fog: false 
    });

    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const distance = 700 + Math.random() * 300; 

        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);
        
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}
const starsBackground = createStars();

function lockPointer() {
    if (gameStarted) {
        document.body.requestPointerLock();
    }
}

window.addEventListener('mousedown', lockPointer);

const ending = new Ending(() => {
    location.reload(); 
});

let gameStarted = false;
let startTime = 0;

const world = new World(scene);
const player = new Neko(scene);
const clock = new THREE.Clock();

// СВЕТ
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const pLight = new THREE.PointLight(0xff00ff, 1.5, 20);
scene.add(pLight);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    startTime = Date.now();
    if (!bgMusic.playing()) bgMusic.play();
    lockPointer(); 
}

new StartMenu(startGame);

function updateTimer() {
    if (!gameStarted) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.innerText = `${m}:${s}`;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1); // Фикс скачков времени
    
    starsBackground.position.copy(camera.position);
    starsBackground.rotation.y += 0.0001;

    if (gameStarted) {
        updateTimer();
        
        // 1. ОПТИМИЗАЦИЯ ПЛАТФОРМ: Передаем только ближайшие платформы в физику
        // Это убирает лаги при ходьбе
        const nearPlatforms = world.platforms.filter(p => 
            p.position.distanceTo(player.mesh.position) < 60
        );
        
        player.update(delta, nearPlatforms, world.items);
        pLight.position.copy(player.mesh.position).y += 2;

        // 2. ОПТИМИЗАЦИЯ СУШИ: Проверяем только те, что в радиусе 30 метров
        world.items.forEach((item) => {
            if (item.visible) {
                const d = player.mesh.position.distanceTo(item.position);
                
                // Рисуем и крутим только если суши в поле видимости
                if (d < 80) {
                    if (d < 1.5) {
                        item.visible = false;
                        scene.remove(item);
                        player.collectItem(item); 
                        const scoreEl = document.getElementById('score');
                        if (scoreEl) scoreEl.innerText = player.score;
                        if (player.score >= 500) ending.show();
                    }
                    item.rotation.y += 0.02; 
                }
            }
        });
    }

    const dist = 10;
    const horizontalDist = dist * Math.cos(player.mouseAngleY || 0.4);
    const verticalDist = dist * Math.sin(player.mouseAngleY || 0.4);

    camera.position.x = player.mesh.position.x + Math.sin(player.mouseAngleX || 0) * horizontalDist;
    camera.position.z = player.mesh.position.z + Math.cos(player.mouseAngleX || 0) * horizontalDist;
    camera.position.y = player.mesh.position.y + verticalDist + 3;

    camera.lookAt(player.mesh.position);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();