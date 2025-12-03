// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// TODO: 替換成你自己的 Firebase 設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- DOM 取得 ---

const loginScreen = document.getElementById("login-screen");
const boardsScreen = document.getElementById("boards-screen");
const listsScreen = document.getElementById("lists-screen");
const itemsScreen = document.getElementById("items-screen");

const googleLoginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userEmailSpan = document.getElementById("user-email");

const boardsGrid = document.getElementById("boards-grid");
const listsList = document.getElementById("lists-list");
const todoListEl = document.getElementById("todo-list");
const noteListEl = document.getElementById("note-list");

const listsTitleEl = document.getElementById("lists-title");
const itemsTitleEl = document.getElementById("items-title");
const listsBackBtn = document.getElementById("lists-back-btn");
const itemsBackBtn = document.getElementById("items-back-btn");

const addTodoBtn = document.getElementById("add-todo-btn");
const addNoteBtn = document.getElementById("add-note-btn");

// --- 簡單 state（目前先用假資料）---

let currentUser = null;
let currentBoardId = null;
let currentListId = null;

// 假資料：之後會改成用 Firestore
const state = {
  boards: [
    { id: "b1", title: "接案工作" },
    { id: "b2", title: "FLT 工作" },
    { id: "b3", title: "日常瑣事" },
    { id: "b4", title: "購物清單" },
  ],
  lists: [
    { id: "l1", boardId: "b2", title: "工作總表" },
    { id: "l2", boardId: "b2", title: "電力見積もり" },
    { id: "l3", boardId: "b2", title: "週會議" },
    { id: "l4", boardId: "b2", title: "雜事" },
  ],
  items: [
    {
      id: "t1",
      listId: "l1",
      type: "todo",
      text: "電力パンフレット（印刷）",
      done: false,
    },
    {
      id: "t2",
      listId: "l1",
      type: "todo",
      text: "IACA 協賛広告 A4 作成",
      done: false,
    },
    {
      id: "n1",
      listId: "l1",
      type: "note",
      title: "說明文件備忘",
      body: "和老闆確認設計截止日，年末前完成。",
    },
  ],
};

// --- 螢幕切換 ---

function showScreen(name) {
  [loginScreen, boardsScreen, listsScreen, itemsScreen].forEach((el) =>
    el.classList.add("hidden")
  );

  if (name === "login") loginScreen.classList.remove("hidden");
  if (name === "boards") boardsScreen.classList.remove("hidden");
  if (name === "lists") listsScreen.classList.remove("hidden");
  if (name === "items") itemsScreen.classList.remove("hidden");
}

// --- render functions ---

function renderBoards() {
  boardsGrid.innerHTML = "";

  state.boards.forEach((board) => {
    const div = document.createElement("div");
    div.className = "board-card";
    div.innerHTML = `
      <div class="board-card__title">${board.title}</div>
      <div class="board-card__meta">
        <span>ID ${board.id}</span>
      </div>
    `;
    div.addEventListener("click", () => {
      currentBoardId = board.id;
      renderLists();
      showScreen("lists");
    });
    boardsGrid.appendChild(div);
  });

  // 新增卡片
  const addCard = document.createElement("div");
  addCard.className = "board-card board-card--add";
  addCard.textContent = "+";
  addCard.addEventListener("click", () => {
    const title = prompt("新的分類名稱");
    if (!title) return;
    const id = "b" + (state.boards.length + 1);
    state.boards.push({ id, title });
    renderBoards();
  });
  boardsGrid.appendChild(addCard);
}

function renderLists() {
  const board = state.boards.find((b) => b.id === currentBoardId);
  listsTitleEl.textContent = board ? board.title : "";
  listsList.innerHTML = "";

  const lists = state.lists.filter((l) => l.boardId === currentBoardId);

  lists.forEach((list) => {
    const row = document.createElement("div");
    row.className = "list-row";
    const itemCount = state.items.filter((i) => i.listId === list.id).length;

    row.innerHTML = `
      <div class="list-row__title">${list.title}</div>
      <div class="list-row__meta">${itemCount} 件</div>
    `;
    row.addEventListener("click", () => {
      currentListId = list.id;
      renderItems();
      showScreen("items");
    });
    listsList.appendChild(row);
  });

  // 新增 list
  const addRow = document.createElement("div");
  addRow.className = "list-row";
  addRow.innerHTML = `
    <div class="list-row__title">＋ 新增清單</div>
  `;
  addRow.addEventListener("click", () => {
    const title = prompt("清單名稱");
    if (!title) return;
    const id = "l" + (state.lists.length + 1);
    state.lists.push({ id, boardId: currentBoardId, title });
    renderLists();
  });
  listsList.appendChild(addRow);
}

function renderItems() {
  const list = state.lists.find((l) => l.id === currentListId);
  itemsTitleEl.textContent = list ? list.title : "";

  const todos = state.items.filter(
    (i) => i.listId === currentListId && i.type === "todo"
  );
  const notes = state.items.filter(
    (i) => i.listId === currentListId && i.type === "note"
  );

  todoListEl.innerHTML = "";
  todos.forEach((t) => {
    const li = document.createElement("li");
    li.className = "item-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.done;
    checkbox.className = "item-row__checkbox";
    checkbox.addEventListener("change", () => {
      t.done = checkbox.checked;
      renderItems();
    });

    const content = document.createElement("div");
    content.className = "item-row__content";
    const title = document.createElement("div");
    title.className = "item-row__title";
    title.textContent = t.text;
    if (t.done) {
      title.style.textDecoration = "line-through";
      title.style.color = "#999";
    }
    content.appendChild(title);

    li.appendChild(checkbox);
    li.appendChild(content);
    todoListEl.appendChild(li);
  });

  noteListEl.innerHTML = "";
  notes.forEach((n) => {
    const li = document.createElement("li");
    li.className = "item-row";

    const content = document.createElement("div");
    content.className = "item-row__content";
    const title = document.createElement("div");
    title.className = "item-row__title";
    title.textContent = n.title || "(未命名筆記)";
    const body = document.createElement("div");
    body.className = "item-row__note";
    body.textContent = n.body || "";
    content.appendChild(title);
    content.appendChild(body);

    li.appendChild(content);
    noteListEl.appendChild(li);
  });
}

// --- 新增項目 ---

addTodoBtn.addEventListener("click", () => {
  if (!currentListId) return;
  const text = prompt("待辦內容");
  if (!text) return;
  const id = "t" + (state.items.length + 1);
  state.items.push({ id, listId: currentListId, type: "todo", text, done: false });
  renderItems();
});

addNoteBtn.addEventListener("click", () => {
  if (!currentListId) return;
  const title = prompt("筆記標題（可空白）") || "";
  const body = prompt("筆記內容（簡單文字即可）") || "";
  const id = "n" + (state.items.length + 1);
  state.items.push({ id, listId: currentListId, type: "note", title, body });
  renderItems();
});

// --- 返回按鈕 ---

listsBackBtn.addEventListener("click", () => {
  showScreen("boards");
});

itemsBackBtn.addEventListener("click", () => {
  showScreen("lists");
});

// --- 登入 / 登出 ---

googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert("登入失敗：" + err.message);
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// --- 監聽登入狀態 ---

onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
  if (user) {
    userEmailSpan.textContent = user.email || "";
    logoutBtn.classList.remove("hidden");
    showScreen("boards");
    renderBoards();
  } else {
    userEmailSpan.textContent = "";
    logoutBtn.classList.add("hidden");
    showScreen("login");
  }
});