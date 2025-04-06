// 导入数据迁移工具
import { checkAndMigrateData, backupData } from './utils/dataMigration';

// 检查版本并执行数据迁移
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('扩展安装/更新事件触发，原因:', details.reason);
  
  // 在安装或更新时都执行数据检查
  try {
    // 首先创建数据备份
    await backupData();
    
    // 检查并执行数据迁移
    await checkAndMigrateData();
    
    // 如果是更新，记录日志
    if (details.reason === 'update') {
      const manifest = chrome.runtime.getManifest();
      const currentVersion = manifest.version;
      const previousVersion = details.previousVersion;
      console.log(`扩展已从 ${previousVersion} 更新到 ${currentVersion}`);
    }
  } catch (error) {
    console.error('数据迁移过程中出错:', error);
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL('index.html'),
    type: 'popup',
    width: 760,
    height: 610
  });
});