import type { Environment } from 'vitest/environments';
import { builtinEnvironments } from 'vitest/environments';

/**
 * Vitestカスタム環境
 * 基本的にはnodeと同じ環境だが、drizzleのセットアップを行う
 *
 * 注意: トランザクション管理はsetupファイル経由で行う
 * この環境はnodeベースの環境として動作する
 */
const DrizzleEnvironment: Environment = {
  name: 'drizzle',
  transformMode: 'ssr',

  async setup(global, options) {
    // node環境をベースに使用
    const nodeEnv = builtinEnvironments.node;
    const result = await nodeEnv.setup(global, options);

    return {
      teardown: result.teardown,
    };
  },
};

export default DrizzleEnvironment;
