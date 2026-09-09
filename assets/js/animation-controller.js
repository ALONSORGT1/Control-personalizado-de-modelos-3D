import * as THREE from 'three';

// Conserva el movimiento local y elimina el salto al origen de los FBX con avance.
export function prepareLoop(source, closingDuration = 0.3) {
  const clip = source.clone();
  const duration = clip.duration;
  if (!(duration > 0)) throw new Error('La animación no tiene duración válida.');

  for (const track of clip.tracks) {
    if (/Hips\.position$/.test(track.name)) {
      const start = track.createInterpolant().evaluate(0).slice();
      const end = track.createInterpolant().evaluate(duration).slice();
      for (let i = 0; i < track.times.length; i++) {
        const progress = track.times[i] / duration;
        for (const axis of [0, 2]) {
          track.values[i * 3 + axis] -= start[axis] + (end[axis] - start[axis]) * progress;
        }
      }
    }
  }

  // Solo añade una unión cuando las poses del principio y del final difieren.
  const needsClosing = clip.tracks.some((track) => {
    const first = track.createInterpolant().evaluate(0).slice();
    const last = track.createInterpolant().evaluate(duration).slice();
    if (track.ValueTypeName === 'quaternion') {
      return new THREE.Quaternion().fromArray(first)
        .angleTo(new THREE.Quaternion().fromArray(last)) > 0.02;
    }
    return first.some((value, index) => Math.abs(value - last[index]) > 0.01);
  });

  if (needsClosing) {
    for (const track of clip.tracks) {
      const size = track.getValueSize();
      const first = track.createInterpolant().evaluate(0).slice();
      const last = track.createInterpolant().evaluate(duration).slice();
      const times = Array.from(track.times);
      const values = Array.from(track.values);
      if (times.at(-1) < duration) {
        times.push(duration);
        values.push(...last);
      }
      // Varios fotogramas con suavizado evitan un cambio brusco de velocidad.
      for (let step = 1; step <= 12; step++) {
        const progress = step / 12;
        const blend = progress * progress * (3 - 2 * progress);
        times.push(duration + closingDuration * progress);
        if (track.ValueTypeName === 'quaternion') {
          values.push(...new THREE.Quaternion().fromArray(last)
            .slerp(new THREE.Quaternion().fromArray(first), blend).toArray());
        } else {
          for (let axis = 0; axis < size; axis++) {
            values.push(THREE.MathUtils.lerp(last[axis], first[axis], blend));
          }
        }
      }
      track.times = new Float32Array(times);
      track.values = new Float32Array(values);
    }
    clip.duration = duration + closingDuration;
  }
  return clip;
}

export class ContinuousAnimations {
  constructor(mixer, transitionDuration = 0.4) {
    this.mixer = mixer;
    this.transitionDuration = transitionDuration;
    this.actions = new Map();
    this.current = null;
    this.transition = null;
  }

  add(name, clip) {
    const action = this.mixer.clipAction(prepareLoop(clip));
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.setEffectiveWeight(0).play();
    action.enabled = false;
    this.actions.set(name, action);
  }

  select(name) {
    const next = this.actions.get(name);
    if (!next || name === this.current) return false;
    // Recupera su tiempo anterior; no reinicia el clip al volver a seleccionarlo.
    next.enabled = true;
    if (this.current === null) {
      next.setEffectiveWeight(1);
    } else {
      this.transition = {
        elapsed: 0,
        weights: new Map([...this.actions].map(([key, action]) => [key, action.weight]))
      };
    }
    this.current = name;
    return true;
  }

  update(delta) {
    if (this.transition) {
      this.transition.elapsed += delta;
      const progress = Math.min(this.transition.elapsed / this.transitionDuration, 1);
      const blend = progress * progress * (3 - 2 * progress);
      for (const [name, action] of this.actions) {
        const target = name === this.current ? 1 : 0;
        const weight = THREE.MathUtils.lerp(this.transition.weights.get(name), target, blend);
        action.setEffectiveWeight(weight);
        action.enabled = weight > 0 || target === 1;
      }
      if (progress === 1) this.transition = null;
    }
    this.mixer.update(delta);
  }
}
