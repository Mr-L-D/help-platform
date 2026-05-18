import { readFileSync } from "node:fs";

const VALID_TYPES = [
  "feat", "fix", "chore", "docs", "style",
  "refactor", "perf", "test", "ci", "build", "revert",
];

const MSG_FILE = process.argv[2];
const raw = readFileSync(MSG_FILE, "utf-8");
const firstLine = raw.split("\n")[0].trim();

let hasError = false;

// 1. 检查空标题
if (!firstLine) {
  console.log("");
  console.log("❌ 提交信息不能为空");
  console.log("   格式: <type>: <主题>");
  console.log("");
  console.log("   示例:");
  console.log("     feat: 添加用户登录功能");
  console.log("     fix(auth): 修复 token 过期问题");
  console.log("     chore: 升级依赖版本");
  console.log("");
  process.exit(1);
}

// 2. 检查是否包含冒号
const colonIdx = firstLine.indexOf(":");
if (colonIdx === -1) {
  console.log("");
  console.log("❌ 提交信息格式错误，缺少冒号 :");
  console.log("   格式: <类型>: <主题>");
  console.log("");
  console.log("   示例:");
  console.log("     feat: 添加用户登录功能");
  console.log("     fix: 修复支付金额计算错误");
  console.log("     chore: 升级 eslint 版本");
  console.log("");
  hasError = true;
}

// 3. 解析 type
const prefix = colonIdx !== -1 ? firstLine.slice(0, colonIdx) : firstLine;
const typeMatch = prefix.match(/^([a-z]+)(?:\([^)]+\))?$/);

if (!typeMatch) {
  console.log("");
  console.log("❌ 提交类型格式错误");
  console.log("   格式: <类型>: <主题> 或 <类型>(<范围>): <主题>");
  console.log("");
  hasError = true;
} else {
  const type = typeMatch[1];
  if (!VALID_TYPES.includes(type)) {
    console.log("");
    console.log(`❌ 无效的提交类型: "${type}"`);
    console.log("   允许的类型:");
    console.log(`     feat     - 新功能`);
    console.log(`     fix      - 修复 Bug`);
    console.log(`     chore    - 杂务（依赖升级、构建配置等）`);
    console.log(`     docs     - 文档变更`);
    console.log(`     refactor - 代码重构`);
    console.log(`     style    - 代码格式（不影响逻辑）`);
    console.log(`     perf     - 性能优化`);
    console.log(`     test     - 测试相关`);
    console.log(`     ci       - CI/CD 配置`);
    console.log(`     build    - 构建系统变更`);
    console.log(`     revert   - 回退代码`);
    console.log("");
    hasError = true;
  }
}

// 4. 检查 subject
if (colonIdx !== -1) {
  const subject = firstLine.slice(colonIdx + 1);
  if (!subject.trim()) {
    console.log("");
    console.log("❌ 提交主题不能为空");
    console.log("   冒号后面需要填写本次提交的描述");
    console.log("   示例: fix: 修复用户列表加载失败的问题");
    console.log("");
    hasError = true;
  }

  if (subject.length > 1 && !subject.startsWith(" ")) {
    console.log("");
    console.log("❌ 冒号后需要加一个空格");
    console.log('   正确: feat: 添加登录');
    console.log('   错误: feat:添加登录');
    console.log("");
    hasError = true;
  }
}

// 5. 首字母大写警告（仅警告，不阻止）
if (colonIdx !== -1) {
  const subject = firstLine.slice(colonIdx + 1).trim();
  if (subject && /^[A-Z]/.test(subject)) {
    console.log("⚠️  建议主题首字母小写（除非是专有名词）");
  }
}

if (hasError) {
  process.exit(1);
}

console.log("✅ 提交信息格式检查通过");
