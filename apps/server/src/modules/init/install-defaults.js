import { AppsManager } from '../apps';
import { config } from '../../config/app-config';
import { readJSONFile } from '../../common/utils/file';
import { installDeviceContributions } from '../init/install-device-contribs';
import { ResourceStorageRegistry } from '../resource-storage-registry';

export function installDefaults() {
  return Promise.resolve([
    installDefaultApps().catch(err => Promise.reject(err)),
    installDeviceContributions(),
  ]);
}

export function installDefaultApps() {
  return readJSONFile(config.defaultAppJsonPath)
    .then(defaultApp => AppsManager.import(defaultApp, ResourceStorageRegistry))
    .catch(err => Promise.reject(err));
}
