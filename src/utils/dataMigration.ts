/**
 * 数据迁移工具
 * 用于处理不同版本之间的数据迁移，确保用户数据在扩展更新后不会丢失
 */

// 版本比较函数
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0; // 版本相同
};

// 最大备份数量常量
const MAX_BACKUPS = 3;

// 清理旧备份函数
const cleanupOldBackups = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  
  try {
    // 获取所有存储的数据
    const data = await chrome.storage.local.get(null);
    
    // 找出所有备份键
    const backupKeys = Object.keys(data).filter(key => key.startsWith('data_backup_'));
    
    // 如果备份数量超过最大值，删除最旧的备份
    if (backupKeys.length >= MAX_BACKUPS) {
      // 按时间戳排序（从旧到新）
      backupKeys.sort((a, b) => {
        const timeA = parseInt(a.replace('data_backup_', ''));
        const timeB = parseInt(b.replace('data_backup_', ''));
        return timeA - timeB;
      });
      
      // 需要删除的备份数量
      const keysToRemove = backupKeys.slice(0, backupKeys.length - MAX_BACKUPS + 1);
      
      // 删除旧备份
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`已清理 ${keysToRemove.length} 个旧备份:`, keysToRemove);
      }
    }
  } catch (error) {
    console.error('清理旧备份失败:', error);
  }
};

// 数据备份函数
export const backupData = async (): Promise<boolean> => {
  if (typeof chrome === 'undefined' || !chrome.storage) return false;
  
  try {
    // 先清理旧备份，确保不超出存储配额
    await cleanupOldBackups();
    
    // 获取所有存储的数据
    const data = await chrome.storage.local.get(null);
    
    // 创建备份，但排除之前的备份数据以减少存储空间使用
    const essentialData = {};
    Object.keys(data).forEach(key => {
      if (!key.startsWith('data_backup_')) {
        essentialData[key] = data[key];
      }
    });
    
    // 创建备份
    const backupKey = `data_backup_${Date.now()}`;
    await chrome.storage.local.set({ [backupKey]: essentialData });
    console.log(`数据备份已创建: ${backupKey}`);
    
    return true;
  } catch (error) {
    console.error('创建数据备份失败:', error);
    return false;
  }
};

// 数据迁移函数
export const migrateData = async (fromVersion: string, toVersion: string): Promise<boolean> => {
  console.log(`执行数据迁移: ${fromVersion} -> ${toVersion}`);
  
  // 首先创建备份
  const backupCreated = await backupData();
  if (!backupCreated) {
    console.warn('无法创建数据备份，迁移可能不安全');
  }
  
  try {
    // 获取所有存储的数据
    const data = await chrome.storage.local.get(null);
    
    // 根据版本执行不同的迁移策略
    // 从0.2.x迁移到1.0
    if (fromVersion.startsWith('0.2') && toVersion === '1.0') {
      // 在这里实现0.2.x到1.0的迁移逻辑
      console.log('执行从0.2.x到1.0的迁移');
      
      // 示例: 重命名某个键
      // if (data.oldKey) {
      //   data.newKey = data.oldKey;
      //   delete data.oldKey;
      // }
    }
    // 示例: 从0.2.x迁移到0.3.x
    else if (fromVersion.startsWith('0.2') && toVersion.startsWith('0.3')) {
      // 在这里实现0.2.x到0.3.x的迁移逻辑
      console.log('执行从0.2.x到0.3.x的迁移');
      
      // 示例: 重命名某个键
      // if (data.oldKey) {
      //   data.newKey = data.oldKey;
      //   delete data.oldKey;
      // }
    }
    
    // 更新存储的版本号
    await chrome.storage.local.set({ 'appVersion': toVersion });
    console.log(`数据迁移完成，版本已更新为 ${toVersion}`);
    
    return true;
  } catch (error) {
    console.error('数据迁移失败:', error);
    return false;
  }
};

// 检查并执行数据迁移
export const checkAndMigrateData = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  
  try {
    // 获取当前版本
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    // 获取存储的版本
    const result = await chrome.storage.local.get(['appVersion']);
    const storedVersion = result.appVersion;
    
    // 如果没有存储的版本或版本不同，执行迁移
    if (!storedVersion) {
      console.log('未找到存储的版本号，这可能是首次安装或数据已丢失');
      await chrome.storage.local.set({ 'appVersion': currentVersion });
    } else if (storedVersion !== currentVersion) {
      console.log(`检测到版本变更: ${storedVersion} -> ${currentVersion}`);
      await migrateData(storedVersion, currentVersion);
    } else {
      console.log(`当前版本 ${currentVersion} 与存储版本一致，无需迁移`);
    }
  } catch (error) {
    console.error('检查数据迁移时出错:', error);
  }
};