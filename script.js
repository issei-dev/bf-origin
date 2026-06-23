// エネミーのステータス定義
let enemyMaxHp = 1000;
let enemyCurrentHp = 1000;

const enemyHpBar = document.querySelector('#enemy-1 .hp-bar');
const playerUnits = document.querySelectorAll('.unit');
const gameContainer = document.getElementById('game-container'); // クリスタルを描画する領域

// 敵にダメージを与える共通関数
function damageEnemy(isBB = false) {
  if (enemyCurrentHp <= 0) return;

  const baseDamage = Math.floor(Math.random() * 51) + 100;
  const damage = isBB ? baseDamage * 3 : baseDamage;

  enemyCurrentHp -= damage;
  if (enemyCurrentHp < 0) enemyCurrentHp = 0;

  const hpPercentage = (enemyCurrentHp / enemyMaxHp) * 100;
  enemyHpBar.style.width = `${hpPercentage}%`;

  console.log(`${isBB ? '🔥ブレイブバースト！🔥 ' : '通常攻撃：'}${damage} のダメージ！`);

  // ★ 追加：ダメージを与えた瞬間にクリスタルをドロップさせる
  const enemyElement = document.getElementById('enemy-1');
  spawnCrystals(enemyElement, damage, isBB);

  if (enemyCurrentHp === 0) {
    setTimeout(() => { alert('ENEMY DEFEATED!!'); }, 300);
  }
}

// ★ 新機能：クリスタルを画面に生成して飛び散らせる関数
function spawnCrystals(enemyElement, damage, isBB) {
  // 敵の中心座標を取得（ゲーム画面からの相対位置）
  const enemyRect = enemyElement.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  const startX = (enemyRect.left + enemyRect.width / 2) - containerRect.left;
  const startY = (enemyRect.top + enemyRect.height / 2) - containerRect.top;

  // ドロップ数（BBならたくさん落ちる）
  const dropCount = isBB ? Math.floor(damage / 30) : Math.floor(damage / 50);

  for (let i = 0; i < dropCount; i++) {
    // 1. HTML要素（div）をJavaScriptで作成
    const crystal = document.createElement('div');
    
    // 80%の確率でBC(黄色)、20%の確率でHC(緑色)にする
    const isBC = Math.random() < 0.8;
    crystal.className = `crystal ${isBC ? 'bc' : 'hc'}`;

    // 初期位置を敵の中心にセット
    crystal.style.left = `${startX}px`;
    crystal.style.top = `${startY}px`;
    gameContainer.appendChild(crystal);

    // 2. 飛び散る先をランダムに計算（円形に散らばる）
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 40; // 40〜120pxの距離
    const scatterX = startX + Math.cos(angle) * distance;
    const scatterY = startY + Math.sin(angle) * distance;

    // ほんの少し遅らせて位置を動かすことで、CSSのtransition（アニメーション）を発動させる
    setTimeout(() => {
      crystal.style.left = `${scatterX}px`;
      crystal.style.top = `${scatterY}px`;
    }, 10);

    // 3. 飛び散ってから 0.8〜1.2秒後 に、味方へ吸収される処理を呼ぶ
    setTimeout(() => {
      absorbCrystal(crystal, isBC);
    }, 800 + Math.random() * 400);
  }
}

// ★ 新機能：クリスタルを味方に吸収させ、ゲージを回復させる関数
function absorbCrystal(crystal, isBC) {
  // ランダムな味方ユニットを1体選ぶ
  const targetUnit = playerUnits[Math.floor(Math.random() * playerUnits.length)];
  const targetRect = targetUnit.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  // 対象ユニットの中心座標
  const targetX = (targetRect.left + targetRect.width / 2) - containerRect.left;
  const targetY = (targetRect.top + targetRect.height / 2) - containerRect.top;

  // 吸収される時は直線的にスッと動くようにアニメーションを変更
  crystal.style.transition = 'all 0.4s ease-in';
  crystal.style.left = `${targetX}px`;
  crystal.style.top = `${targetY}px`;

  // 0.4秒後（到着した瞬間）に画面から消し、ゲージを増やす
  setTimeout(() => {
    crystal.remove(); // 画面から消去（DOMの削除）

    if (isBC) {
      // BCなら黄色いBBゲージを増やす
      const bbBar = targetUnit.querySelector('.bb-bar');
      let currentBB = parseInt(bbBar.style.width) || 0; // 現在の%を取得
      currentBB = Math.min(100, currentBB + 5); // 1個につき5%回復（上限100）
      bbBar.style.width = `${currentBB}%`;
    } else {
      // HCなら緑色のHPゲージを回復
      const hpBar = targetUnit.querySelector('.hp-bar');
      let currentHP = parseInt(hpBar.style.width) || 0;
      currentHP = Math.min(100, currentHP + 10); // 1個につき10%回復（上限100）
      hpBar.style.width = `${currentHP}%`;
    }
  }, 400);
}

// --- 以下、前回と同じ操作（タップ・スワイプ）の判定処理 ---
playerUnits.forEach(unit => {
  let startX = 0, startY = 0, endX = 0, endY = 0;
  const swipeThreshold = 30; 

  function handleStart(x, y) { startX = x; startY = y; }
  function handleEnd(x, y) {
    endX = x; endY = y;
    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) < swipeThreshold && Math.abs(diffY) < swipeThreshold) {
      executeNormalAttack(unit);
      return;
    }
    if (Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY < -swipeThreshold) executeBraveBurst(unit);
      else if (diffY > swipeThreshold) executeGuard(unit);
    }
  }

  unit.addEventListener('touchstart', (e) => { handleStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  unit.addEventListener('touchend', (e) => { handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }, { passive: true });
  unit.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY);
    const onMouseUp = (me) => { handleEnd(me.clientX, me.clientY); window.removeEventListener('mouseup', onMouseUp); };
    window.addEventListener('mouseup', onMouseUp);
  });
});

function executeNormalAttack(unit) {
  damageEnemy(false);
  unit.style.transform = 'translateY(-20px)';
  setTimeout(() => { unit.style.transform = 'translateY(0)'; }, 100);
}

function executeBraveBurst(unit) {
  const bbBar = unit.querySelector('.bb-bar');
  if (bbBar && bbBar.style.width === '100%') {
    damageEnemy(true);
    unit.style.transform = 'translateY(-50px) scale(1.2)';
    unit.style.filter = 'brightness(1.5)';
    bbBar.style.width = '0%';
    setTimeout(() => {
      unit.style.transform = 'translateY(0) scale(1)';
      unit.style.filter = 'none';
    }, 200);
  } else {
    executeNormalAttack(unit);
  }
}

function executeGuard(unit) {
  unit.style.transform = 'translateY(15px)';
  unit.style.opacity = '0.7';
  setTimeout(() => {
    unit.style.transform = 'translateY(0)';
    unit.style.opacity = '1';
  }, 1000);
}
