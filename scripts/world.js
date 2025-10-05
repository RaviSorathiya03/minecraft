import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng";
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshMatcapMaterial({color: "#7CFC00"});
export class World extends THREE.Group{
    constructor (size = {width: 32, height: 16}){
        super();
        this.size = size;
    }

    data = [];

    params = {
        seed: 0,
        terrain: {
            scale: 30,
            magnitude: 0.5,
            offset: 0.2 
        }
    };

    generate(){
        this.initTerrain()
        this.generateTerrain();
        this.generateMeshes();
    }
    //Initializing the world terrain data
    initTerrain(){
        this.data = [];
        for(let x = 0;x<this.size.width;x++){
            let slices = [];
            for(let y = 0;y<this.size.height; y++){
                const row = [];
                for(let z = 0;z<this.size.width;z++){
                    row.push({
                        id: 0,
                        instanceId: null
                    });
                }
                slices.push(row);
            }
            this.data.push(slices);
        }
    }

    generateTerrain(){
        const rng = new RNG(this.params.seed);
        const simple = new SimplexNoise(rng);
        for(let x=0;x<this.size.width;x++){
            for(let z = 0;z<this.size.width;z++){
                const value = simple.noise(
                    x / this.params.terrain.scale, 
                    z / this.params.terrain.magnitude
                );

                const scaledNoise = (this.params.terrain.offset) + this.params.terrain.magnitude * value;

                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height ));

                for(let y = 0; y<=height; y++){
                    this.setBlockId(x, y, z, 1);
                }
            }
        }
    }

    generateMeshes(){
        this.clear();
        const maxCount = this.size.width * this.size.width * this.size.height 
        const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
        mesh.count = 0;
        const matrix = new THREE.Matrix4();
        for(let x=0;x<this.size.width;x++){
            for(let y = 0;y<this.size.height;y++){
                for(let z=0;z<this.size.width;z++){
                    const blockId = this.getBlocks(x, y, z).id;
                    const instanceId = mesh.count;
                    if(blockId !== 0){
                        matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
                        mesh.setMatrixAt(instanceId, matrix);
                        this.setBlockInstanceId(x, y, z, instanceId);
                        mesh.count++;
                    }
                }
            }
        }

        this.add(mesh);
    }

    getBlocks(x, y, z){
        if(this.inBounds(x, y, z)){
            return this.data[x][y][z];
        } else{
            return null;
        }
    }

    setBlockId(x, y, z, id){
        if(this.inBounds(x, y, z)){
            this.data[x][y][z].id = id;
        }
    }

    setBlockInstanceId(x, y, z, instanceId){
        if(this.inBounds(x, y, z)){
            this.data[x][y][z].instanceId = instanceId;
        }
    }

    inBounds(x, y, z){
        if(x>=0 && x < this.size.width &&
            y>=0 && y < this.size.height &&
            z>=0 && z < this.size.width
        ){
            return true
        } else{
            return false
        }
    }
}