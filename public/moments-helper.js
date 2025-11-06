/**
 * 朋友圈助手脚本
 * 用于在聊天室页面检查朋友圈未读数量
 */

window.momentsHelper = (function () {
  let checkInterval = null;
  let currentRoomId = null;

  // 初始化朋友圈助手
  function init() {
    // 从URL获取房间ID
    const pathMatch = window.location.pathname.match(/\/room\/([^/]+)/);
    if (!pathMatch) return;

    currentRoomId = pathMatch[1];
    console.log("🎭 朋友圈助手已初始化, 房间ID:", currentRoomId);

    // 立即检查一次
    checkUnreadCount();

    // 每30秒检查一次
    checkInterval = setInterval(checkUnreadCount, 30000);
  }

  // 检查未读数量
  async function checkUnreadCount() {
    if (!currentRoomId) return;

    try {
      // 获取当前用户
      const sessionResponse = await fetch("/api/auth/session");
      const sessionData = await sessionResponse.json();

      if (!sessionData.user) {
        return;
      }

      // 获取未读数量
      const response = await fetch(
        `/api/moments/${currentRoomId}/unread?userId=${sessionData.user.id}`
      );
      const data = await response.json();

      if (data.success) {
        updateUnreadBadge(data.unreadCount);
      }
    } catch (error) {
      console.error("检查朋友圈未读数量失败:", error);
    }
  }

  // 更新未读徽章
  function updateUnreadBadge(count) {
    const badge = document.querySelector(".btn-moments .unread-badge");

    if (!badge) return;

    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  // 跳转到朋友圈
  function goToMoments() {
    if (currentRoomId) {
      window.location.href = `/room/${currentRoomId}/moments`;
    }
  }

  // 页面加载时初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // 稍微延迟，确保DOM已渲染
    setTimeout(init, 500);
  }

  // 页面卸载时清理
  window.addEventListener("beforeunload", function () {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });

  console.log("✅ 朋友圈助手脚本已加载");

  // 暴露公共方法
  return {
    goToMoments,
    checkUnreadCount,
    init
  };
})();

