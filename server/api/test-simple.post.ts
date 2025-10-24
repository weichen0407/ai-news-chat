export default defineEventHandler(async (event) => {
  try {
    console.log("测试API被调用");
    return {
      success: true,
      message: "测试API工作正常",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("测试API错误:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});
