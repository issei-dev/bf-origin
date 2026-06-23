// エネミーのステータス定義
let enemyMaxHp = 1000;
let enemyCurrentHp = 1000;

const enemyHpBar = document.querySelector('#enemy-1 .hp-bar');
const playerUnits = document.querySelectorAll('.unit');
const gameContainer = document.getElementById('game-container');

// --- 既存のコード ---
let enemyMaxHp = 1000;
let enemyCurrentHp = 1000;
const enemyHpBar = document.querySelector('#enemy-1 .hp-bar');
const playerUnits = document.querySelectorAll('.unit');
const gameContainer = document.getElementById('game-container');

// ★ 追加：効果音の読み込み
const seAttack = new Audio('assets/attack.mp3');


// ★ 追加：ターン管理用の変数
let isPlayerTurn = true;
let actedUnitsCount = 0;
const totalUnits = playerUnits.length;

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

  const enemyElement = document.getElementById('enemy-1');
  spawnCrystals(enemyElement, damage, isBB);

  if (enemyCurrentHp === 0) {
    setTimeout(() => { alert('ENEMY DEFEATED!!'); }, 300);
  }
}

// クリスタル生成関数
function spawnCrystals(enemyElement, damage, isBB) {
  const enemyRect = enemyElement.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  const startX = (enemyRect.left + enemyRect.width / 2) - containerRect.left;
  const startY = (enemyRect.top + enemyRect.height / 2) - containerRect.top;

  const dropCount = isBB ? Math.floor(damage / 30) : Math.floor(damage / 50);

  for (let i = 0; i < dropCount; i++) {
    const crystal = document.createElement('div');
    const isBC = Math.random() < 0.8;
    crystal.className = `crystal ${isBC ? 'bc' : 'hc'}`;

    crystal.style.left = `${startX}px`;
    crystal.style.top = `${startY}px`;
    gameContainer.appendChild(crystal);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 40;
    const scatterX = startX + Math.cos(angle) * distance;
    const scatterY = startY + Math.sin(angle) * distance;

    setTimeout(() => {
      crystal.style.left = `${scatterX}px`;
      crystal.style.top = `${scatterY}px`;
    }, 10);

    setTimeout(() => {
      absorbCrystal(crystal, isBC);
    }, 800 + Math.random() * 400);
  }
}

// クリスタル吸収関数
function absorbCrystal(crystal, isBC) {
  const targetUnit = playerUnits[Math.floor(Math.random() * playerUnits.length)];
  const targetRect = targetUnit.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const targetX = (targetRect.left + targetRect.width / 2) - containerRect.left;
  const targetY = (targetRect.top + targetRect.height / 2) - containerRect.top;

  crystal.style.transition = 'all 0.4s ease-in';
  crystal.style.left = `${targetX}px`;
  crystal.style.top = `${targetY}px`;

  setTimeout(() => {
    crystal.remove();
    if (isBC) {
      const bbBar = targetUnit.querySelector('.bb-bar');
      let currentBB = parseInt(bbBar.style.width) || 0;
      currentBB = Math.min(100, currentBB + 5);
      bbBar.style.width = `${currentBB}%`;
    } else {
      const hpBar = targetUnit.querySelector('.hp-bar');
      let currentHP = parseInt(hpBar.style.width) || 0;
      currentHP = Math.min(100, currentHP + 10);
      hpBar.style.width = `${currentHP}%`;
    }
  }, 400);
}

// ★ 追加：行動完了の処理
function finishAction(unit) {
  unit.classList.add('acted');
  
  // アニメーションが終わった頃に行動済みの目印（少し暗くする）をつける
  setTimeout(() => {
    unit.style.filter = 'brightness(0.5)';
  }, 300);

  actedUnitsCount++;

  // 全員が行動したら敵のターンへ
  if (actedUnitsCount >= totalUnits) {
    // クリスタルの吸収が終わるのを少し待ってから敵が動く
    setTimeout(startEnemyTurn, 1500);
  }
}

// 操作（タップ・スワイプ）の判定処理
playerUnits.forEach(unit => {
  let startX = 0, startY = 0, endX = 0, endY = 0;
  const swipeThreshold = 30; 

  function handleStart(x, y) { startX = x; startY = y; }
  function handleEnd(x, y) {
    endX = x; endY = y;
    const diffX = endX - startX;
    const diffY = endY - startY;

    // ★ 追加：敵のターン中、または既に行動済みのユニットは操作不可にする
    if (!isPlayerTurn || unit.classList.contains('acted')) return;

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
  
  // ★ 追加：効果音を最初から再生する
  seAttack.currentTime = 0; // 連続タップしても最初から鳴るようにリセット
  seAttack.play();

  // 既存のアニメーション処理
  unit.style.transform = 'translateY(-20px)';
  setTimeout(() => { unit.style.transform = 'translateY(0)'; }, 100);
  finishAction(unit);
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
      // BBのフラッシュ後に暗くするためのリセットは finishAction 内で行う
    }, 200);
    finishAction(unit); // 行動完了
  } else {
    executeNormalAttack(unit);
  }
}

function executeGuard(unit) {
  unit.classList.add('guarding'); // 防御状態の目印をつける
  unit.style.transform = 'translateY(15px)';
  unit.style.opacity = '0.7';
  setTimeout(() => {
    unit.style.transform = 'translateY(0)';
  }, 1000);
  finishAction(unit); // 行動完了
}

// ★ 新機能：エネミーターンの処理
function startEnemyTurn() {
  if (enemyCurrentHp <= 0) return; // すでに倒していれば反撃しない

  isPlayerTurn = false;
  console.log('--- ENEMY TURN ---');

  const enemyElement = document.getElementById('enemy-1');
  
  // 敵の攻撃アニメーション（下に少し突進）
  enemyElement.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    enemyElement.style.transform = 'translateY(0)';
    
    // 味方の中からランダムに1体をターゲットに選ぶ
    const targetIndex = Math.floor(Math.random() * totalUnits);
    const targetUnit = playerUnits[targetIndex];
    
    // 敵からのダメージ計算（例: HPバーを20%〜40%削る）
    const enemyDamagePercent = Math.floor(Math.random() * 21) + 20; 
    const hpBar = targetUnit.querySelector('.hp-bar');
    let currentHpPercent = parseInt(hpBar.style.width) || 100;
    
    // ★ ターゲットがガード（下スワイプ）していたらダメージ半減！
    const isGuarding = targetUnit.classList.contains('guarding');
    const finalDamagePercent = isGuarding ? Math.floor(enemyDamagePercent / 2) : enemyDamagePercent;

    // ダメージを適用
    currentHpPercent -= finalDamagePercent;
    if (currentHpPercent < 0) currentHpPercent = 0;
    hpBar.style.width = `${currentHpPercent}%`;

    // 味方の被ダメージアニメーション（横にブルッと震える）
    targetUnit.style.transform = 'translateX(-5px)';
    setTimeout(() => { targetUnit.style.transform = 'translateX(5px)'; }, 50);
    setTimeout(() => { targetUnit.style.transform = 'translateX(0)'; }, 100);

    // 1秒後にプレイヤーのターンへ戻す
    setTimeout(resetPlayerTurn, 1000);

  }, 300);
}

// ★ 新機能：プレイヤーターンへ戻す処理
function resetPlayerTurn() {
  console.log('--- PLAYER TURN ---');
  
  // 全員の状態をリセット（明るさを戻し、ガード状態を解除）
  playerUnits.forEach(unit => {
    unit.classList.remove('acted');
    unit.classList.remove('guarding');
    unit.style.filter = 'none';
    unit.style.opacity = '1';
  });
  
  actedUnitsCount = 0;
  isPlayerTurn = true;
}
// --- 既存の変数 ---
let isPlayerTurn = true;
let actedUnitsCount = 0;
const totalUnits = playerUnits.length;

// ★ 追加：バトルが終了したかどうかを判定するフラグ
let isBattleEnded = false; 

  // ★ 修正：敵を倒した時の処理
  if (enemyCurrentHp === 0 && !isBattleEnded) {
    isBattleEnded = true; // バトル終了フラグを立てる
    
    // クリスタルの吸収アニメーションが終わるのを待ってからリザルトを表示（約1.5秒後）
    setTimeout(showResultScreen, 1500); 
  }
// ★ 新機能：リザルト画面の表示と報酬計算
function showResultScreen() {
  console.log('--- QUEST CLEAR ---');

  // 1. 報酬のランダム計算
  const zel = Math.floor(Math.random() * 500) + 1000;   // 1000〜1500のゼル
  const karma = Math.floor(Math.random() * 200) + 500;  // 500〜700のカルマ
  
  // 60%の確率でアイテムドロップ
  const isItemDrop = Math.random() < 0.6;
  const itemName = isItemDrop ? '回復薬' : 'なし';

  // 2. HTMLの文字を書き換える
  document.getElementById('reward-zel').textContent = zel;
  document.getElementById('reward-karma').textContent = karma;
  document.getElementById('reward-item').textContent = itemName;

  // 3. リザルト画面を表示する（.show クラスを追加）
  const resultScreen = document.getElementById('result-screen');
  resultScreen.classList.add('show');
}

// NEXTボタンを押した時の処理（今はアラートだけ出しておきます）
document.getElementById('next-btn').addEventListener('click', () => {
  alert('ホーム画面へ戻ります（今後実装予定！）');
});
  function handleEnd(x, y) {
    endX = x; endY = y;
    const diffX = endX - startX;
    const diffY = endY - startY;

    // ★ 修正：バトル終了後も操作不可にする
    if (!isPlayerTurn || unit.classList.contains('acted') || isBattleEnded) return;


