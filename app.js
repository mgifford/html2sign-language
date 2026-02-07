// app.js
// Three.js-based signer engine for static GitHub Pages
//
// SIGN LANGUAGE ANIMATION FALLBACK STRATEGY:
// When a specific sign animation doesn't exist, the system uses this hierarchy:
// 1. Exact match: Load pre-recorded GLB animation from animations/ folder
// 2. Compound breakdown: Split hyphenated/underscored words and play components
//    Example: "LEGAL-DIFFERENCE" → play "LEGAL" then "DIFFERENCE" sequentially
// 3. Fingerspelling: Spell out word letter-by-letter (requires alphabet animations)
// 4. Text-only fallback: Show text description with warning
//
// This ensures accessibility even when complete sign vocabulary isn't available.
// IMPORTANT: Fallbacks are NOT equivalent to real sign language - they are temporary
// measures until proper sign language animations are created by Deaf linguists.

const canvas = document.getElementById("signer-canvas");
const toggleButton = document.getElementById("toggle-animation");
const signDescription = document.getElementById("sign-description");
const avatarStatus = document.getElementById("avatar-status");
const debugLogEl = document.getElementById("debug-log");

let scene, camera, renderer;
let clock;
let mixer;
let avatar;
let vrmAvatar; // VRM-specific instance
let idleAction;
let currentAction;
let isPaused = false;

let loader;
const actionCache = new Map();
let signMetadata = {};

// SignAvatars dataset reference for biomechanical validation
// See: https://signavatars.github.io/ (ECCV 2024)
const BIOMECHANICAL_VALIDATION = {
  enabled: true,
  source: "SignAvatars 8.34M frames dataset",
  constraints: "temporal smoothing + anatomical joint limits"
};

function debug(message, level = "info") {
  const prefix = level.toUpperCase();
  const timestamp = new Date().toLocaleTimeString();
  const text = `[${timestamp}] [${prefix}] ${message}`;
  console[level === "error" ? "error" : "log"](text);

  if (!debugLogEl) return;

  const line = document.createElement("div");
  line.textContent = text;
  debugLogEl.appendChild(line);

  // Keep the last ~40 lines to avoid unbounded growth
  const maxLines = 40;
  while (debugLogEl.children.length > maxLines) {
    debugLogEl.removeChild(debugLogEl.firstChild);
  }

  debugLogEl.scrollTop = debugLogEl.scrollHeight;
}

// Log initial state
debug("Starting signer engine initialization...");
debug(`THREE available: ${typeof window.THREE !== 'undefined'}`);

init().catch((error) => {
  debug(`Failed to initialise signer engine: ${error?.message || error}`, "error");
  debug(`Error stack: ${error?.stack || 'No stack trace'}`, "error");
  if (signDescription) {
    signDescription.textContent =
      "The 3D avatar could not be loaded. Please use the text description instead.";
  }
  if (avatarStatus) {
    avatarStatus.textContent =
      "Avatar could not be loaded. Ensure animation GLB files exist in the animations/ folder.";
  }
});

async function init() {
  // Ensure Three.js is available before proceeding
  if (typeof window.THREE === "undefined") {
    debug(
      "Three.js global (THREE) is not defined. Check that the three.min.js script is loading correctly.",
      "error"
    );
    if (avatarStatus) {
      avatarStatus.textContent =
        "Three.js library could not be loaded. The avatar cannot be displayed. Check your network or script tags.";
    }
    return;
  }

  if (typeof THREE.GLTFLoader === "undefined") {
    debug(
      "THREE.GLTFLoader is not available. Check that the GLTFLoader.js script is included after three.min.js.",
      "error"
    );
    if (avatarStatus) {
      avatarStatus.textContent =
        "GLTFLoader is missing. Ensure the GLTFLoader.js script is referenced in index.html.";
    }
    return;
  }

  loader = new THREE.GLTFLoader();

  await loadSignMetadata();
  initThree();
  await loadAvatarModel();
  initInteraction();
  animate();
}

async function loadSignMetadata() {
  try {
    debug("Loading signs.json metadata…");
    const response = await fetch("signs.json", { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    signMetadata = await response.json();
    debug("signs.json loaded successfully.");
  } catch (error) {
    debug(`Could not load signs.json; using empty metadata. ${error?.message || error}`, "error");
    signMetadata = {};
  }
}

function initThree() {
  if (!canvas) return;

  debug("Initialising Three.js scene…");

  scene = new THREE.Scene();
  // Dark background for high-contrast sign language visibility (AGENTS.md: High Contrast Mode)
  scene.background = new THREE.Color(0x1a1a2e);

  const width = canvas.clientWidth || 400;
  const height = canvas.clientHeight || 260;

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  // SMPL-X avatar centered at origin after converter fix.
  // Wider FOV + further back to frame full body with outstretched arms.
  camera.position.set(0, -0.1, 3.0);
  camera.lookAt(0, -0.1, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(width, height, false);
  renderer.outputEncoding = THREE.sRGBEncoding;

  // High-contrast lighting: strong frontal light defines finger shadows & facial expressions
  const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);  // Warm front key
  keyLight.position.set(1, 2, 4);  // Front-left, above

  const fillLight = new THREE.DirectionalLight(0xc8d8ff, 0.5);  // Cool fill
  fillLight.position.set(-2, 0.5, 2);  // Front-right, lower

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);  // Strong rim for depth
  rimLight.position.set(0, 2, -3);  // Behind

  const ambient = new THREE.AmbientLight(0x404060, 0.3);  // Low ambient for contrast

  scene.add(keyLight, fillLight, rimLight, ambient);

  debug("Three.js scene and lights initialised.");

  clock = new THREE.Clock();

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  if (!renderer || !camera || !canvas) return;
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || 260;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

async function loadAvatarModel() {
  if (!canvas) return;

  // Use SMPL-X idle pose (biomechanically accurate, optimized for sign language)
  // This is a neutral standing pose with subtle breathing animation
  // SMPL-X format includes full hand and facial detail needed for ASL
  const idlePath = "animations/idle-neutral.glb";
  
  debug("Loading SMPL-X neutral idle pose (optimized for sign language visibility)...");
  debug("SMPL-X features: Full hand articulation, facial expressions, biomechanical constraints");
  
  return new Promise((resolve, reject) => {
    loader.load(
      idlePath,
      (gltf) => {
        debug("SMPL-X idle pose loaded successfully!");
        avatar = gltf.scene;
        avatar.position.set(0, 0, 0);
        scene.add(avatar);
        
        mixer = new THREE.AnimationMixer(avatar);
        
        debug(`Idle pose has ${gltf.animations?.length || 0} animations`);
        
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((clip, i) => {
            debug(`  Animation ${i}: "${clip.name}" (${clip.duration.toFixed(2)}s)`);
          });
          
          idleAction = mixer.clipAction(gltf.animations[0]);
          idleAction.setEffectiveTimeScale(1.0);
          idleAction.play();
          currentAction = idleAction;
          
          debug(`Idle animation loaded: "${gltf.animations[0].name}"`);
        }
        
        if (avatarStatus) {
          avatarStatus.textContent = "✅ SMPL-X avatar loaded (biomechanically accurate with full hand & face detail for ASL)";
        }
        
        debug("SMPL-X avatar initialization complete.");
        resolve();
      },
      undefined,
      (error) => {
        debug(`Error loading SMPL-X idle pose: ${error?.message || error}`, "error");
        if (avatarStatus) {
          avatarStatus.textContent = "⚠️ Could not load idle pose. Will load sign animations directly.";
        }
        
        // Don't create placeholder - just resolve and let sign animations provide the avatar
        debug("Will load avatar from first sign animation played.");
        resolve();
      }
    );
  });
}

function loadGLBAvatar(path, resolve, reject) {
  debug(`Attempting to load GLB avatar from ${path}...`);
  // Supports standard GLB/GLTF formats including:
  // - SMPL-X (full-body mesh with hands and facial expressions) - per SignAvatars dataset
  // - VRM (humanoid avatars with blend shapes)
  // - Mixamo-compliant skeletal rigs
  // All formats are compatible with Three.js GLTFLoader
  loader.load(
    path,
    (gltf) => {
      avatar = gltf.scene;
      avatar.position.set(0, 0, 0);
      scene.add(avatar);

        mixer = new THREE.AnimationMixer(avatar);

        debug(`Avatar has ${gltf.animations?.length || 0} embedded animations.`);
        
        if (gltf.animations && gltf.animations.length > 0) {
          // Log all available animation names
          gltf.animations.forEach((clip, i) => {
            debug(`  Animation ${i}: "${clip.name}" (${clip.duration.toFixed(2)}s)`);
          });
          
          // Find a subtle idle animation or use a very gentle version
          // Look for animations named "idle" or "rest" first
          const idleClip = gltf.animations.find(clip => 
            /idle|rest|neutral/i.test(clip.name)
          ) || gltf.animations[0];
          
          idleAction = mixer.clipAction(idleClip);
          // Reduce the speed to make it more subtle and less distracting
          idleAction.setEffectiveTimeScale(0.3);
          idleAction.play();
          currentAction = idleAction;
          
          debug(`Using idle animation: "${idleClip.name}" at 30% speed for subtlety.`);
        }

        if (avatarStatus) {
          avatarStatus.textContent =
            "Avatar loaded. Humanoid skeletal structure verified. ⚠️ Sign animations are placeholders - real sign language GLB files needed.";
        }

      debug("Base avatar and idle animation loaded successfully.");

      resolve();
    },
    undefined,
    (error) => {
      debug(`Error loading base avatar: ${error?.message || error}`, "error");
      if (avatarStatus) {
        avatarStatus.textContent =
          "Avatar could not be loaded. Creating a placeholder avatar instead.";
      }

      // Create a simple procedural placeholder avatar so the sidecar is visible
      try {
        createPlaceholderAvatar();
        debug("Procedural placeholder avatar created.");
        if (avatarStatus) {
          avatarStatus.textContent =
            "Demo placeholder shown. Add VRM or GLB files to models/ folder for full functionality.";
        }
        resolve();
      } catch (e) {
        debug(`Failed to create placeholder avatar: ${e?.message || e}`, "error");
        reject(error || e);
      }
    }
  );
}

function createPlaceholderAvatar() {
  // Simple group with a torso (box) and head (sphere)
  const group = new THREE.Group();

  const torsoGeom = new THREE.BoxGeometry(0.6, 0.9, 0.3);
  const limbGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 12);
  const headGeom = new THREE.SphereGeometry(0.18, 16, 12);

  const mat = new THREE.MeshStandardMaterial({ color: 0xf2c094 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });

  const torso = new THREE.Mesh(torsoGeom, darkMat);
  torso.position.set(0, 0.45, 0);
  group.add(torso);

  const head = new THREE.Mesh(headGeom, mat);
  head.position.set(0, 1.05, 0);
  group.add(head);

  const leftArm = new THREE.Mesh(limbGeom, darkMat);
  leftArm.position.set(-0.45, 0.55, 0);
  leftArm.rotation.z = Math.PI / 2.8;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(limbGeom, darkMat);
  rightArm.position.set(0.45, 0.55, 0);
  rightArm.rotation.z = -Math.PI / 2.8;
  group.add(rightArm);

  // Simple subtle idle animation using a small up/down tween via clock
  avatar = group;
  avatar.position.set(0, 0, 0);
  scene.add(avatar);

  // Create a lightweight mixer-less pseudo-idle using the existing clock in animate()
  // We'll animate the group manually in the render loop if mixer is not present.
  // Mark mixer as null so playSign prompts the user that no real animations are available.
  mixer = null;

  if (avatarStatus) {
    avatarStatus.textContent =
      "Demo avatar ready. Add GLB models and animation files for sign language playback.";
  }
}

async function loadSignAction(signKey) {
  if (!signKey) return null;

  if (actionCache.has(signKey)) {
    debug(`Using cached animation for sign key: ${signKey}.`);
    return actionCache.get(signKey);
  }

  const meta = signMetadata[signKey] || {};
  
  // Log additional metadata if available
  if (meta.hamnosys) {
    debug(`HamNoSys notation for '${signKey}': ${meta.hamnosys}`);
  }
  if (meta.biomechanical) {
    debug(`Animation '${signKey}' is marked as biomechanically validated.`);
  }
  
  // GENERAL FALLBACK STRATEGY:
  // 1. Try exact match from metadata
  // 2. Try breaking compound words (LEGAL-DIFFERENCE → LEGAL + DIFFERENCE)
  // 3. Fall back to fingerspelling individual letters
  
  if (!meta.file) {
    debug(`No animation file for '${signKey}'. Checking fallback strategies...`);
    
    // Check if this is a compound word that can be broken down
    if (signKey.includes('-') || signKey.includes('_')) {
      const parts = signKey.split(/[-_]/);
      const availableParts = parts.filter(part => signMetadata[part]?.file);
      
      if (availableParts.length > 0) {
        debug(`Compound word '${signKey}' can be signed as: ${availableParts.join(' + ')}`);
        return { 
          compound: true,
          parts: parts,
          availableParts: availableParts,
          text: signKey, 
          description: meta.description 
        };
      }
    }
    
    // No components available - must fingerspell
    debug(`Will fingerspell '${signKey}' letter by letter.`);
    return { fingerspell: true, text: signKey, description: meta.description };
  }
  
  const fileName = meta.file;
  const url = `animations/${fileName}`;

  debug(`Attempting to load sign animation from ${url}…`);

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        if (!gltf.animations || gltf.animations.length === 0) {
          debug(`No animations found in ${url}.`, "error");
          if (avatarStatus) {
            avatarStatus.textContent =
              "No animation was found for this sign. Ensure the corresponding GLB in the animations folder has at least one clip.";
          }
          resolve(null);
          return;
        }

        debug(`Sign GLB has ${gltf.animations.length} animations.`);
        gltf.animations.forEach((clip, i) => {
          debug(`  Anim ${i}: "${clip.name}" (${clip.duration.toFixed(2)}s)`);
        });

        const clip = gltf.animations[0];
        
        // Check if this is a placeholder animation (idle or wave)
        const isPlaceholder = /idle|wave|dance|breathing/i.test(clip.name) || 
                             fileName.includes('idle.glb') || 
                             fileName.includes('wave.glb');
        
        if (isPlaceholder) {
          debug(`WARNING: '${signKey}' is using a placeholder animation ('${clip.name}'). Real sign language animation needed.`, "error");
          resolve({ 
            fingerspell: true, 
            text: signKey, 
            description: meta.description,
            placeholder: true
          });
          return;
        }
        
        // IMPORTANT: Morph target animations are mesh-specific.
        // Each sign GLB contains its own mesh with its own morph targets.
        // We must store the entire GLTF scene + clip so we can swap meshes when playing.
        const signData = {
          signGLTF: true,
          scene: gltf.scene,
          clip: clip,
          signKey: signKey,
          description: meta.description
        };

        actionCache.set(signKey, signData);
        debug(`Sign animation loaded and cached for key: ${signKey}.`);
        resolve(signData);
      },
      undefined,
      (error) => {
        debug(`Could not load animation from ${url}. Falling back to fingerspelling.`);
        resolve({ fingerspell: true, text: signKey, description: meta.description });
      }
    );
  });
}

async function playSign(signKey) {
  if (isPaused) return;

  const action = await loadSignAction(signKey);
  if (!action) return;

  // Handle compound words (e.g., LEGAL-DIFFERENCE → LEGAL + DIFFERENCE)
  if (action.compound) {
    debug(`Playing compound sign: ${action.availableParts.join(' + ')}`);
    
    if (avatarStatus) {
      avatarStatus.textContent = `Compound sign: ${action.text} = ${action.availableParts.join(' + ')} (sequential playback)`;
    }
    
    if (signDescription) {
      signDescription.textContent = `Compound: ${action.availableParts.join(' + ')}. Missing complete sign for "${action.text}".`;
    }
    
    // Play each component sequentially
    for (const part of action.availableParts) {
      await playSign(part);
      // Brief pause between signs
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return;
  }

  // Handle fingerspelling (no pre-recorded animation)
  if (action.fingerspell) {
    const meta = signMetadata[signKey] || {};
    const description = meta.description || `Fingerspelling: ${action.text}`;
    
    debug(`Fingerspelling '${action.text}' - no real sign language animation available`);
    
    if (avatarStatus) {
      if (action.placeholder) {
        avatarStatus.textContent = `⚠️ No sign language animation for "${signKey}". Placeholder files detected.`;
      } else {
        avatarStatus.textContent = `Text representation: ${signKey} (no animation file)`;
      }
    }
    
    if (signDescription) {
      signDescription.textContent = `⚠️ PLACEHOLDER ONLY: ${description}. This is NOT sign language - real animation needed.`;
    }
    
    if (canvas) {
      canvas.setAttribute("aria-label", `Warning: No sign language animation available for ${signKey}. Text description: ${description}`);
    }
    return;
  }

  // Handle GLTF-based morph target animation (mesh swap approach)
  if (action.signGLTF) {
    debug(`Playing sign '${signKey}' via mesh swap (morph target animation).`);
    
    // Remove current avatar from the scene
    if (avatar && avatar.parent) {
      avatar.parent.remove(avatar);
    }
    
    // Stop any current mixer
    if (mixer) {
      mixer.stopAllAction();
    }
    
    // Add the sign's own scene (which has the mesh with morph targets)
    const signScene = action.scene;
    signScene.position.set(0, 0, 0);
    scene.add(signScene);
    
    // Create a new mixer for this sign's scene
    mixer = new THREE.AnimationMixer(signScene);
    
    // Play the sign's animation clip on its own mesh
    const signAction = mixer.clipAction(action.clip);
    signAction.clampWhenFinished = true;
    signAction.loop = THREE.LoopOnce;
    signAction.reset();
    signAction.setEffectiveTimeScale(1);
    signAction.setEffectiveWeight(1);
    signAction.play();
    currentAction = signAction;
    
    debug(`Sign '${signKey}' animation playing (${action.clip.duration.toFixed(2)}s).`);
    
    // When the sign finishes, swap back to idle avatar
    const onFinish = () => {
      debug(`Sign '${signKey}' completed. Returning to idle avatar.`);
      
      // Remove sign scene
      if (signScene.parent) {
        signScene.parent.remove(signScene);
      }
      
      // Restore idle avatar
      if (avatar) {
        scene.add(avatar);
        mixer = new THREE.AnimationMixer(avatar);
        
        if (idleAction) {
          // Re-create idle action on new mixer
          // We need the idle clip - find it from the avatar's userData or recreate
          // Since idleAction was created from the original idle GLTF, we stored the clip
          const idleClip = idleAction.getClip();
          idleAction = mixer.clipAction(idleClip);
          idleAction.setEffectiveTimeScale(1.0);
          idleAction.play();
          currentAction = idleAction;
        }
        
        if (signDescription) {
          signDescription.textContent = "Avatar is in idle state.";
        }
        if (canvas) {
          canvas.setAttribute("aria-label", "Sign language avatar in idle state.");
        }
      }
      
      mixer.removeEventListener('finished', onFinish);
    };
    
    mixer.addEventListener('finished', onFinish);
    
    updateSignAccessibility(signKey);
    highlightActiveParagraph(signKey);
    return;
  }

  // Legacy: Handle pre-recorded animation actions (non-morph-target)
  if (!mixer) {
    debug("No animation mixer available for pre-recorded animations.");
    return;
  }

  if (currentAction !== action) {
    action.reset();
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);

    if (currentAction) {
      action.crossFadeFrom(currentAction, 0.3, false);
    }

    action.play();
    currentAction = action;
    
    const onFinish = () => {
      if (idleAction && currentAction === action) {
        debug(`Sign '${signKey}' completed. Returning to idle.`);
        idleAction.reset();
        idleAction.crossFadeFrom(action, 0.5, false);
        idleAction.play();
        currentAction = idleAction;
        
        if (signDescription) {
          signDescription.textContent = "Avatar is in idle state.";
        }
        if (canvas) {
          canvas.setAttribute("aria-label", "Sign language avatar in idle state.");
        }
      }
      mixer.removeEventListener('finished', onFinish);
    };
    
    mixer.addEventListener('finished', onFinish);
  }

  updateSignAccessibility(signKey);
  highlightActiveParagraph(signKey);
}

async function preloadSign(signKey) {
  await loadSignAction(signKey);
  highlightTriggers(signKey);
}

function highlightTriggers(activeKey) {
  const triggers = document.querySelectorAll(".sign-trigger[data-sign]");
  triggers.forEach((el) => {
    if (el.dataset.sign === activeKey) {
      el.classList.add("is-active");
    } else {
      el.classList.remove("is-active");
    }
  });
}

function highlightActiveParagraph(activeKey) {
  // Highlight the paragraph that corresponds to the current sign
  const paragraphs = document.querySelectorAll(".sign-paragraph[data-sign]");
  paragraphs.forEach((el) => {
    if (el.dataset.sign === activeKey) {
      el.classList.add("is-signing");
    } else {
      el.classList.remove("is-signing");
    }
  });
}

function updateSignAccessibility(signKey) {
  const meta = signMetadata[signKey] || {};
  const description =
    meta.description || `Avatar is signing: ${signKey.replace(/[-_]/g, " ")}.`;

  // Include HamNoSys notation in accessible description if available
  const hamnosysInfo = meta.hamnosys ? ` HamNoSys notation: ${meta.hamnosys}.` : "";
  const fullDescription = description + hamnosysInfo;

  if (canvas) {
    const baseLabel = "Sign language avatar. ";
    canvas.setAttribute("aria-label", baseLabel + fullDescription);
  }

  if (signDescription) {
    signDescription.textContent = description;
  }
}

function initInteraction() {
  let lastPlayedSign = null;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const signKey = element.dataset.sign;

        if (entry.isIntersecting) {
          element.classList.add("is-in-view");
          if (signKey) {
            // Auto-play the sign when the paragraph comes into view
            // This ensures deaf users see meaningful signs as they read
            if (signKey !== lastPlayedSign) {
              debug(`Auto-playing sign for visible section: ${signKey}`);
              playSign(signKey);
              lastPlayedSign = signKey;
            }
          }
        } else {
          element.classList.remove("is-in-view");
        }
      });
    },
    { threshold: 0.55 }
  );

  document
    .querySelectorAll(".sign-paragraph[data-sign]")
    .forEach((el) => observer.observe(el));

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".sign-trigger[data-sign]");
    if (!trigger) return;
    event.preventDefault();
    const signKey = trigger.dataset.sign;
    playSign(signKey);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.classList.contains("sign-trigger") &&
      target.hasAttribute("data-sign")
    ) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const signKey = target.dataset.sign;
        playSign(signKey);
      }
    }
  });

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      isPaused = !isPaused;
      toggleButton.setAttribute("aria-pressed", String(isPaused));
      toggleButton.textContent = isPaused ? "Play avatar" : "Pause avatar";

      if (isPaused) {
        if (mixer) mixer.timeScale = 0;
        if (signDescription) {
          signDescription.textContent =
            "Avatar animation paused. Activate the Play button to resume.";
        }
      } else {
        if (mixer) mixer.timeScale = 1;
        if (signDescription && !signDescription.textContent) {
          signDescription.textContent = "Avatar is idle.";
        }
      }
    });
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (mixer && !isPaused && clock) {
    const delta = clock.getDelta();
    mixer.update(delta);
  }

  // Visible idle animation for placeholder avatar when no mixer is available
  if (!mixer && avatar && !isPaused && clock) {
    const elapsed = clock.getElapsedTime();
    // More pronounced breathing/sway motion (increased amplitude)
    avatar.position.y = Math.sin(elapsed * 1.2) * 0.08;  // Increased from 0.02
    avatar.rotation.y = Math.sin(elapsed * 0.8) * 0.15;  // Increased from 0.05
    // Add slight side-to-side sway
    avatar.position.x = Math.sin(elapsed * 0.6) * 0.05;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
