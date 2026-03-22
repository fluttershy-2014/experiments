import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.platforms = [];
        this.items = [];
        this.generate();
    }

    generate() {
        this.addPlatform(0, 0, 0, 15, 15, 0x111122, false); 
        
        let lastPos = new THREE.Vector3(0, 0, 0);
        let currentAngle = Math.random() * Math.PI * 2; 
        const totalPlatforms = 500;

        for (let i = 1; i <= totalPlatforms; i++) {
            const progress = i / totalPlatforms;
            const isCheckpoint = i % 40 === 0;
            const isFinal = i === totalPlatforms;
            const size = isFinal ? 30 : 4;

            let x, y, z;
            let foundSpot = false;
            let attempts = 0;

            while (!foundSpot && attempts < 200) {
                // 1. УГОЛ: Позволяем крутиться назад, но не слишком резко за один шаг
                const angleChaos = 0.5 + (progress * 1.0); 
                const testAngle = currentAngle + (Math.random() - 0.5) * Math.PI * angleChaos;

                // 2. ФИКС ДИСТАНЦИИ: 
                // В начале 8м, в конце СТРОГО максимум 14-15м. 
                // Это гарантирует, что двойной прыжок всегда дотянет.
                const minDist = 8 + (progress * 5); 
                const dist = minDist + Math.random() * 2; // Рандом даем маленький, чтобы не "выстрелило" за предел

                x = lastPos.x + Math.sin(testAngle) * dist;
                z = lastPos.z + Math.cos(testAngle) * dist;
                
                // 3. ФИКС ВЕРТИКАЛИ:
                // Вверх растем стабильно, но прыжок по высоте не больше 5-6 метров,
                // иначе кошечка не запрыгнет на платформу.
                const climb = 1.5 + (progress * 4); 
                y = lastPos.y + (Math.random() * climb); 

                const newPos = new THREE.Vector3(x, y, z);

                // 4. КОНТРОЛЬ ЭТАЖЕЙ:
                const tooClose = this.platforms.some(p => {
                    const dx = Math.abs(p.position.x - x);
                    const dz = Math.abs(p.position.z - z);
                    const dy = Math.abs(p.position.y - y);

                    // Если одна под другой — зазор 20 метров (навигация)
                    if (dx < (size + 2) && dz < (size + 2)) {
                        return dy < 20; 
                    }
                    
                    // Чтобы не слипались в 3D
                    return p.position.distanceTo(newPos) < 8;
                });

                if (!tooClose || attempts === 199) {
                    foundSpot = true;
                    currentAngle = testAngle;
                }
                attempts++;
            }

            // Твои сочные цвета
            let color;
            if (isFinal) {
                color = 0xffd700;
            } else if (isCheckpoint) {
                color = 0xff0000;
            } else {
                const r = Math.floor(150 + Math.random() * 106);
                const g = Math.floor(150 + Math.random() * 106);
                const b = Math.floor(150 + Math.random() * 106);
                color = (r << 16) | (g << 8) | b;
            }

            this.addPlatform(x, y, z, size, size, color, isCheckpoint);
            this.addItem(x, y + (isCheckpoint ? 2.8 : 1.5), z);

            lastPos.set(x, y, z);
        }
    }

    addPlatform(x, y, z, w, d, color, isCheckpoint) {
        const geo = new THREE.BoxGeometry(w, 0.5, d);
        const mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            emissive: color, 
            emissiveIntensity: 0.4 
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(x, y, z);
        this.scene.add(p);
        this.platforms.push(p);

        if (isCheckpoint) {
            const earShape = new THREE.ConeGeometry(0.4, 0.8, 3); 
            const earMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff66cc, emissiveIntensity: 1.5 });
            const l = new THREE.Mesh(earShape, earMat);
            l.position.set(-1.6, 0.6, 0); 
            p.add(l);
            const r = l.clone();
            r.position.x = 1.6;
            p.add(r);
            const light = new THREE.PointLight(0xff66cc, 5, 25);
            light.position.set(0, 3, 0);
            p.add(light);
        }

        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
        p.add(line);
    }

    addItem(x, y, z) {
        const geo = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.6 });
        const item = new THREE.Mesh(geo, mat);
        item.position.set(x, y, z);
        this.scene.add(item);
        this.items.push(item);
    }
}