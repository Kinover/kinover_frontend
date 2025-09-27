import { openNotification } from '../utils/openNotification';
import { ensurePostLoaded } from '../deps/ensurePostLoaded';


async function onTapNotification(n) {
  await openNotification(n, navigation, { ensurePostLoaded });
}
