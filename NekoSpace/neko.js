import * as THREE from 'three';

export class Neko {
    constructor(scene) {
        this.scene = scene;
        this.mesh = this.createNeko();
        scene.add(this.mesh);
        
        this.velocity = new THREE.Vector3();
        this.keys = {};
        this.score = 0;
        this.lastCheckpointScore = 0;
        this.itemsSinceCheckpoint = []; 
        this.jumpCount = 0; 
        
        this.mouseAngleX = 0;
        this.mouseAngleY = 0.4; 
        
        this.startPos = new THREE.Vector3(0, 5, 0);
        this.lastCheckpointPos = null;
        this.currentCPId = -1;

        // ЗВУКИ — Исправлено залипание через pool и спрайты
        try {
            this.soundMeow = new Howl({ 
                src: ['https://zvukipro.com/uploads/files/2020-03/1584776195_d6b8a8f21491d95.mp3'], 
                volume: 0.15,
                pool: 10, // Теперь звуки могут накладываться, не прерываясь
                sprite: { short: [0, 500] } // Короткий "пик" для бодрости
            });
            this.soundJump = new Howl({ 
                src: ['https://zvukipro.com/uploads/files/2018-10/1539083199_rubberband-02.mp3'], 
                volume: 0.15,
                pool: 5 
            });
            this.soundCheckpoint = new Howl({ 
                src: ['https://zvukipro.com/uploads/files/2020-07/1595047389_45435a970c52904.mp3'], 
                volume: 0.4,
                pool: 2
            });
        } catch(e) { console.log("Звуки не загрузились"); }

        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.mouseAngleX -= e.movementX * 0.003;
                this.mouseAngleY = Math.max(-1.2, Math.min(1.2, this.mouseAngleY + e.movementY * 0.003));
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.jump();
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        this.resetToStart();
    }

    createNeko() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        body.position.y = 0.4;
        group.add(body);
        
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0xff99cc }));
        const eL = ear.clone(); eL.position.set(0.25, 0.9, 0);
        const eR = ear.clone(); eR.position.set(-0.25, 0.9, 0);
        
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        const eyeL = eye.clone(); eyeL.position.set(0.2, 0.6, -0.4);
        const eyeR = eye.clone(); eyeR.position.set(-0.2, 0.6, -0.4);
        
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xff6699 }));
        nose.position.set(0, 0.5, -0.41);
        
        group.add(eL, eR, eyeL, eyeR, nose);
        return group;
    }

    collectItem(item) {
        this.score++;
        this.itemsSinceCheckpoint.push(item);
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = this.score;
        
        if (this.soundMeow) {
            // Чтобы звук не залипал, останавливаем старый и играем короткий спрайт
            this.soundMeow.stop(); 
            this.soundMeow.play('short'); 
        }
    }

    resetToStart() {
        this.mesh.position.copy(this.startPos);
        this.lastCheckpointPos = null;
        this.lastCheckpointScore = 0;
        this.itemsSinceCheckpoint = [];
        this.score = 0;
        this.currentCPId = -1;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = "0";
    }

    update(delta, platforms, worldItems) {
        const move = new THREE.Vector3();
        if (this.keys['KeyW']) move.z -= 1;
        if (this.keys['KeyS']) move.z += 1;
        if (this.keys['KeyA']) move.x -= 1;
        if (this.keys['KeyD']) move.x += 1;
        
        if (move.length() > 0) {
            move.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mouseAngleX);
            move.multiplyScalar(0.18);
            this.mesh.position.add(move);
            this.mesh.rotation.y = Math.atan2(move.x, move.z) + Math.PI;
        }

        this.velocity.y -= 0.01;
        this.mesh.position.y += this.velocity.y;

        platforms.forEach((p, idx) => {
            const box = new THREE.Box3().setFromObject(p);
            if (this.mesh.position.x > box.min.x - 0.4 && this.mesh.position.x < box.max.x + 0.4 &&
                this.mesh.position.z > box.min.z - 0.4 && this.mesh.position.z < box.max.z + 0.4) {
                if (this.velocity.y <= 0 && this.mesh.position.y >= box.max.y - 0.3 && this.mesh.position.y <= box.max.y + 0.2) {
                    this.mesh.position.y = box.max.y;
                    this.velocity.y = 0;
                    this.jumpCount = 0;

                    if (p.material.color.getHex() === 0xff0000 && this.currentCPId !== idx) {
                        this.currentCPId = idx;
                        this.lastCheckpointPos = new THREE.Vector3(p.position.x, p.position.y + 2, p.position.z);
                        this.lastCheckpointScore = this.score;
                        this.itemsSinceCheckpoint = [];
                        if (this.soundCheckpoint) this.soundCheckpoint.play();
                    }
                }
            }
        });

        if (this.mesh.position.y < -120) {
            this.itemsSinceCheckpoint.forEach(i => { i.visible = true; this.scene.add(i); });
            if (this.lastCheckpointPos) {
                this.mesh.position.copy(this.lastCheckpointPos);
                this.score = this.lastCheckpointScore;
            } else {
                this.resetToStart();
                worldItems.forEach(i => { i.visible = true; this.scene.add(i); });
            }
            this.itemsSinceCheckpoint = [];
            this.velocity.set(0,0,0);
            const scoreEl = document.getElementById('score');
            if (scoreEl) scoreEl.innerText = this.score;
        }
    }

    jump() {
        if (this.jumpCount < 2) {
            this.velocity.y = this.jumpCount === 0 ? 0.28 : 0.32;
            this.jumpCount++;
            if (this.soundJump) {
                this.soundJump.stop();
                this.soundJump.play();
            }
        }
    }
}