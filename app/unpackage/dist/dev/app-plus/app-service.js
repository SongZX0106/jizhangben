if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return typeof component === "string" ? easycom : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const STORAGE_KEY$5 = "asset_snapshots";
  const _sfc_main$8 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const rawSnapshots = vue.ref([]);
      const compareMode = vue.ref(false);
      const selectedIds = vue.ref([]);
      const showCompare = vue.ref(false);
      function loadSnapshots() {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$5);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          rawSnapshots.value = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          rawSnapshots.value = [];
        }
      }
      onShow(() => {
        loadSnapshots();
        compareMode.value = false;
        selectedIds.value = [];
        showCompare.value = false;
      });
      const computedSnapshots = vue.computed(() => {
        const sorted = [...rawSnapshots.value].sort((a, b) => {
          const dateCmp = b.date.localeCompare(a.date);
          if (dateCmp !== 0)
            return dateCmp;
          return (b.id || "").localeCompare(a.id || "");
        });
        return sorted.map((item, i) => {
          const total = (item.platforms || []).reduce(
            (s, p) => s + (parseFloat(p.amount) || 0),
            0
          );
          let change = null;
          if (i < sorted.length - 1) {
            const prev = sorted[i + 1];
            const prevTotal = (prev.platforms || []).reduce(
              (s, p) => s + (parseFloat(p.amount) || 0),
              0
            );
            const diff = total - prevTotal;
            const pct = prevTotal > 0 ? diff / prevTotal * 100 : 0;
            change = { diff, pct };
          }
          return { ...item, total, change };
        });
      });
      const groupedSnapshots = vue.computed(() => {
        const groups = [];
        let currentYear2 = null;
        computedSnapshots.value.forEach((item) => {
          const year = item.date ? item.date.substring(0, 4) : "未知";
          if (year !== currentYear2) {
            currentYear2 = year;
            groups.push({ year, items: [] });
          }
          groups[groups.length - 1].items.push(item);
        });
        return groups;
      });
      function formatNum(n) {
        const num = parseFloat(n) || 0;
        const parts = num.toFixed(2).split(".");
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const decPart = parts[1];
        return decPart === "00" ? intPart : intPart + "." + decPart.replace(/0+$/, "");
      }
      function formatNumCN(n) {
        const cnNums = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
        const cnUnits = ["", "拾", "佰", "仟"];
        const cnBigUnits = ["", "万", "亿"];
        const num = Math.abs(parseFloat(n) || 0);
        const parts = num.toFixed(2).split(".");
        let intStr = parts[0];
        let result = "";
        let zero = false;
        for (let i = 0; i < intStr.length; i++) {
          const digit = parseInt(intStr[i]);
          const pos = intStr.length - 1 - i;
          const unit = cnUnits[pos % 4];
          const bigUnit = cnBigUnits[Math.floor(pos / 4)];
          if (digit === 0) {
            zero = true;
            if (pos % 4 === 0 && bigUnit)
              result += bigUnit;
          } else {
            if (zero) {
              result += "零";
              zero = false;
            }
            result += cnNums[digit] + unit;
            if (pos % 4 === 0)
              result += bigUnit;
          }
        }
        if (!result)
          result = "零";
        result += "元";
        const jiao = parseInt(parts[1][0]);
        const fen = parseInt(parts[1][1]);
        if (jiao === 0 && fen === 0) {
          result += "整";
        } else {
          if (jiao > 0)
            result += cnNums[jiao] + "角";
          else if (result.indexOf("元") < result.length - 1)
            result += "零";
          if (fen > 0)
            result += cnNums[fen] + "分";
        }
        return result;
      }
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      function formatDate(dateStr) {
        if (!dateStr)
          return "";
        const d = new Date(dateStr);
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const wd = weekdays[d.getDay()];
        return `${m} · ${day} · ${wd}`;
      }
      function previewImage(urls, index) {
        uni.previewImage({
          urls,
          current: urls[index]
        });
      }
      const deleteDialog = vue.ref({ show: false, item: null });
      function confirmDelete(item) {
        deleteDialog.value = { show: true, item };
      }
      function closeDelete() {
        deleteDialog.value = { show: false, item: null };
      }
      function doDelete() {
        const item = deleteDialog.value.item;
        if (!item)
          return;
        const idx = rawSnapshots.value.findIndex((s) => s.id === item.id);
        if (idx > -1) {
          rawSnapshots.value.splice(idx, 1);
          const selIdx = selectedIds.value.indexOf(item.id);
          if (selIdx > -1)
            selectedIds.value.splice(selIdx, 1);
          uni.setStorageSync(STORAGE_KEY$5, JSON.stringify(rawSnapshots.value));
          uni.showToast({ title: "已删除", icon: "success" });
        }
        closeDelete();
      }
      function enterCompareMode() {
        selectedIds.value = [];
        compareMode.value = true;
      }
      function exitCompareMode() {
        compareMode.value = false;
        selectedIds.value = [];
      }
      function isSelected(id) {
        return selectedIds.value.includes(id);
      }
      function toggleSelect(id) {
        const idx = selectedIds.value.indexOf(id);
        if (idx > -1) {
          selectedIds.value.splice(idx, 1);
        } else {
          selectedIds.value.push(id);
        }
      }
      const selectedSnapshots = vue.computed(() => {
        return computedSnapshots.value.filter((s) => selectedIds.value.includes(s.id)).sort((a, b) => a.date.localeCompare(b.date));
      });
      const allPlatformNames = vue.computed(() => {
        const names = /* @__PURE__ */ new Set();
        selectedSnapshots.value.forEach((s) => {
          (s.platforms || []).forEach((p) => names.add(p.name));
        });
        return [...names];
      });
      const compareTableData = vue.computed(() => {
        const snapshots = selectedSnapshots.value;
        const names = allPlatformNames.value;
        return snapshots.map((snapshot, rowIdx) => {
          const row = { date: snapshot.date, id: snapshot.id, cells: {} };
          names.forEach((name) => {
            const platform = (snapshot.platforms || []).find(
              (p) => p.name === name
            );
            const amount = platform ? parseFloat(platform.amount) || 0 : null;
            let change = null;
            if (rowIdx > 0 && amount !== null && amount > 0) {
              const prevSnapshot = snapshots[rowIdx - 1];
              const prevPlatform = (prevSnapshot.platforms || []).find(
                (p) => p.name === name
              );
              const prevAmount = prevPlatform ? parseFloat(prevPlatform.amount) || 0 : null;
              if (prevAmount !== null && prevAmount > 0) {
                const diff = amount - prevAmount;
                const pct = diff / prevAmount * 100;
                change = { diff, pct };
              }
            }
            row.cells[name] = { amount, change };
          });
          return row;
        });
      });
      function startCompare() {
        if (selectedIds.value.length < 2) {
          uni.showToast({ title: "请至少选择 2 项", icon: "none" });
          return;
        }
        showCompare.value = true;
      }
      function closeCompare() {
        showCompare.value = false;
      }
      function goAdd() {
        uni.navigateTo({ url: "/pages/add/index" });
      }
      function goGacha() {
        uni.navigateTo({ url: "/pages/gacha/list/index" });
      }
      const __returned__ = { STORAGE_KEY: STORAGE_KEY$5, rawSnapshots, compareMode, selectedIds, showCompare, loadSnapshots, computedSnapshots, groupedSnapshots, formatNum, formatNumCN, currentYear, weekdays, formatDate, previewImage, deleteDialog, confirmDelete, closeDelete, doDelete, enterCompareMode, exitCompareMode, isSelected, toggleSelect, selectedSnapshots, allPlatformNames, compareTableData, startCompare, closeCompare, goAdd, goGacha, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" APP BAR "),
      vue.createElementVNode("view", { class: "app-bar" }, [
        vue.createElementVNode("view", { class: "app-bar-left" }, [
          vue.createElementVNode("text", { class: "app-logo" }, "时迹"),
          vue.createElementVNode("text", { class: "app-tagline" }, "ShiJi")
        ]),
        vue.createElementVNode("view", { class: "app-bar-right" }, [
          vue.createElementVNode("text", {
            class: "gacha-btn",
            onClick: $setup.goGacha
          }, "◆ 抽卡"),
          !$setup.compareMode && $setup.computedSnapshots.length > 1 ? (vue.openBlock(), vue.createElementBlock("text", {
            key: 0,
            class: "compare-btn",
            onClick: $setup.enterCompareMode
          }, "横向对比")) : vue.createCommentVNode("v-if", true),
          $setup.compareMode ? (vue.openBlock(), vue.createElementBlock("text", {
            key: 1,
            class: "compare-btn cancel",
            onClick: $setup.exitCompareMode
          }, "取消")) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.createCommentVNode(" HERO "),
      vue.createElementVNode("view", { class: "hero" }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass([
              "hero-card",
              $setup.computedSnapshots.length > 0 && $setup.computedSnapshots[0].change ? $setup.computedSnapshots[0].change.pct >= 0 ? "hero-up" : "hero-down" : "hero-neutral"
            ])
          },
          [
            vue.createElementVNode(
              "view",
              { class: "hero-watermark" },
              vue.toDisplayString($setup.currentYear),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "hero-left" }, [
              vue.createElementVNode("text", { class: "hero-eyebrow" }, "Portfolio Snapshot"),
              vue.createElementVNode("view", { class: "hero-title" }, [
                vue.createElementVNode("text", { class: "hero-title-main" }, "资产快照")
              ])
            ]),
            $setup.computedSnapshots.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "hero-right"
            }, [
              vue.createElementVNode("view", { class: "stat-block" }, [
                vue.createElementVNode("text", { class: "stat-label" }, "最新总资产"),
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  " ¥" + vue.toDisplayString($setup.formatNum($setup.computedSnapshots[0].total)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "stat-value-cn" },
                  vue.toDisplayString($setup.formatNumCN($setup.computedSnapshots[0].total)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "stat-row" }, [
                vue.createElementVNode("view", { class: "stat-block" }, [
                  vue.createElementVNode("text", { class: "stat-label" }, "较上次变动"),
                  $setup.computedSnapshots[0].change ? (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 0,
                      class: vue.normalizeClass([
                        "stat-change",
                        $setup.computedSnapshots[0].change.pct >= 0 ? "up" : "down"
                      ])
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "arrow-icon" },
                        vue.toDisplayString($setup.computedSnapshots[0].change.pct >= 0 ? "▲" : "▼"),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString($setup.computedSnapshots[0].change.pct >= 0 ? "+" : "") + vue.toDisplayString($setup.computedSnapshots[0].change.pct.toFixed(1)) + "%",
                        1
                        /* TEXT */
                      )
                    ],
                    2
                    /* CLASS */
                  )) : (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "stat-change neutral"
                  }, [
                    vue.createElementVNode("text", null, "—")
                  ]))
                ]),
                vue.createElementVNode("view", { class: "stat-block stat-divider" }, [
                  vue.createElementVNode("text", { class: "stat-label" }, "记录次数"),
                  vue.createElementVNode(
                    "text",
                    { class: "stat-value stat-value-sm" },
                    vue.toDisplayString($setup.computedSnapshots.length),
                    1
                    /* TEXT */
                  )
                ])
              ])
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "hero-right hero-empty"
            }, [
              vue.createElementVNode("text", { class: "empty-hint" }, "还没有快照记录，点击右下角 + 开始记录")
            ])),
            vue.createElementVNode("view", { class: "hero-bottom" }, [
              vue.createElementVNode("text", { class: "hero-sub" }, "不定期记录，看见真实的变化")
            ])
          ],
          2
          /* CLASS */
        )
      ]),
      vue.createCommentVNode(" TIMELINE "),
      $setup.computedSnapshots.length > 0 ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: vue.normalizeClass(["timeline", { "timeline-compare": $setup.compareMode }])
        },
        [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.groupedSnapshots, (group, gi) => {
              return vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                {
                  key: group.year
                },
                [
                  vue.createElementVNode("view", { class: "year-divider" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "year-text" },
                      vue.toDisplayString(group.year),
                      1
                      /* TEXT */
                    )
                  ]),
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(group.items, (item, idx) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        class: "snapshot",
                        key: item.id
                      }, [
                        $setup.compareMode ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 0,
                          class: "snapshot-select",
                          onClick: ($event) => $setup.toggleSelect(item.id)
                        }, [
                          vue.createElementVNode(
                            "view",
                            {
                              class: vue.normalizeClass(["select-circle", $setup.isSelected(item.id) ? "selected" : ""])
                            },
                            [
                              $setup.isSelected(item.id) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 0,
                                class: "select-check"
                              }, "✓")) : vue.createCommentVNode("v-if", true)
                            ],
                            2
                            /* CLASS */
                          )
                        ], 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                        vue.createElementVNode("view", { class: "snapshot-header" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "snapshot-date" },
                            vue.toDisplayString($setup.formatDate(item.date)),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode("text", {
                            class: "snapshot-delete",
                            onClick: ($event) => $setup.confirmDelete(item)
                          }, " 删除 ", 8, ["onClick"])
                        ]),
                        vue.createElementVNode("view", { class: "snapshot-card" }, [
                          vue.createElementVNode("view", { class: "card-header" }, [
                            vue.createElementVNode("view", { class: "card-total-area" }, [
                              vue.createElementVNode("text", { class: "card-total-label" }, "总资产"),
                              vue.createElementVNode("view", { class: "card-total-row" }, [
                                vue.createElementVNode(
                                  "text",
                                  { class: "card-total-amount" },
                                  vue.toDisplayString($setup.formatNum(item.total)),
                                  1
                                  /* TEXT */
                                ),
                                vue.createElementVNode("text", { class: "currency" }, "CNY")
                              ])
                            ]),
                            item.change ? (vue.openBlock(), vue.createElementBlock("view", {
                              key: 0,
                              class: "card-change"
                            }, [
                              vue.createElementVNode(
                                "view",
                                {
                                  class: vue.normalizeClass([
                                    "change-badge",
                                    item.change.pct >= 0 ? "up" : "down"
                                  ])
                                },
                                [
                                  vue.createElementVNode(
                                    "text",
                                    { class: "arrow-icon" },
                                    vue.toDisplayString(item.change.pct >= 0 ? "▲" : "▼"),
                                    1
                                    /* TEXT */
                                  ),
                                  vue.createElementVNode(
                                    "text",
                                    null,
                                    vue.toDisplayString(item.change.pct >= 0 ? "+" : "") + vue.toDisplayString(item.change.pct.toFixed(1)) + "%",
                                    1
                                    /* TEXT */
                                  )
                                ],
                                2
                                /* CLASS */
                              ),
                              vue.createElementVNode(
                                "text",
                                { class: "change-amount" },
                                vue.toDisplayString(item.change.diff >= 0 ? "+" : "") + "¥" + vue.toDisplayString($setup.formatNum(item.change.diff)),
                                1
                                /* TEXT */
                              )
                            ])) : vue.createCommentVNode("v-if", true)
                          ]),
                          item.platforms && item.platforms.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 0,
                            class: "platforms"
                          }, [
                            (vue.openBlock(true), vue.createElementBlock(
                              vue.Fragment,
                              null,
                              vue.renderList(item.platforms, (p) => {
                                return vue.openBlock(), vue.createElementBlock("view", {
                                  class: "platform-chip",
                                  key: p.name
                                }, [
                                  vue.createElementVNode(
                                    "view",
                                    {
                                      class: vue.normalizeClass(["platform-icon", p.cls || "default"])
                                    },
                                    [
                                      vue.createElementVNode(
                                        "text",
                                        { class: "platform-icon-text" },
                                        vue.toDisplayString(p.icon || p.name[0]),
                                        1
                                        /* TEXT */
                                      )
                                    ],
                                    2
                                    /* CLASS */
                                  ),
                                  vue.createElementVNode("view", { class: "platform-info" }, [
                                    vue.createElementVNode(
                                      "text",
                                      { class: "platform-name" },
                                      vue.toDisplayString(p.name),
                                      1
                                      /* TEXT */
                                    ),
                                    vue.createElementVNode(
                                      "text",
                                      { class: "platform-amount" },
                                      "¥" + vue.toDisplayString($setup.formatNum(p.amount)),
                                      1
                                      /* TEXT */
                                    )
                                  ])
                                ]);
                              }),
                              128
                              /* KEYED_FRAGMENT */
                            ))
                          ])) : vue.createCommentVNode("v-if", true),
                          item.screenshots && item.screenshots.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 1,
                            class: "screenshots"
                          }, [
                            (vue.openBlock(true), vue.createElementBlock(
                              vue.Fragment,
                              null,
                              vue.renderList(item.screenshots, (s, si) => {
                                return vue.openBlock(), vue.createElementBlock("view", {
                                  class: "screenshot-thumb",
                                  key: s,
                                  onClick: ($event) => $setup.previewImage(item.screenshots, si)
                                }, [
                                  vue.createElementVNode("image", {
                                    src: s,
                                    mode: "aspectFill"
                                  }, null, 8, ["src"])
                                ], 8, ["onClick"]);
                              }),
                              128
                              /* KEYED_FRAGMENT */
                            ))
                          ])) : vue.createCommentVNode("v-if", true),
                          item.note ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 2,
                            class: "card-note"
                          }, [
                            vue.createElementVNode(
                              "text",
                              { class: "note-text" },
                              vue.toDisplayString(item.note),
                              1
                              /* TEXT */
                            )
                          ])) : vue.createCommentVNode("v-if", true)
                        ])
                      ]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ],
                64
                /* STABLE_FRAGMENT */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ],
        2
        /* CLASS */
      )) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" COMPARE BAR "),
      $setup.compareMode ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "compare-bar"
      }, [
        vue.createElementVNode("view", { class: "compare-bar-inner" }, [
          vue.createElementVNode("text", { class: "compare-bar-hint" }, "点击卡片多选，选择至少 2 项进行对比"),
          vue.createElementVNode("view", { class: "compare-bar-row" }, [
            vue.createElementVNode(
              "text",
              { class: "compare-bar-count" },
              "已选 " + vue.toDisplayString($setup.selectedIds.length) + " 项",
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "compare-bar-actions" }, [
              vue.createElementVNode("text", {
                class: "compare-bar-cancel",
                onClick: $setup.exitCompareMode
              }, "退出"),
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["compare-bar-confirm", $setup.selectedIds.length < 2 ? "disabled" : ""]),
                  onClick: $setup.startCompare
                },
                "开始对比",
                2
                /* CLASS */
              )
            ])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" FAB "),
      !$setup.compareMode ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "fab",
        onClick: $setup.goAdd
      }, [
        vue.createElementVNode("text", { class: "fab-icon" }, "+")
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" COMPARE OVERLAY "),
      $setup.showCompare ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "compare-overlay",
        onClick: $setup.closeCompare
      }, [
        vue.createElementVNode("view", {
          class: "compare-panel",
          onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "compare-panel-header" }, [
            vue.createElementVNode("text", { class: "compare-panel-title" }, "横向对比"),
            vue.createElementVNode("text", {
              class: "compare-panel-close",
              onClick: $setup.closeCompare
            }, "✕")
          ]),
          vue.createElementVNode("view", { class: "compare-panel-body" }, [
            vue.createElementVNode("view", { class: "compare-table" }, [
              vue.createElementVNode("view", { class: "compare-row compare-header-row" }, [
                vue.createElementVNode("view", { class: "compare-cell compare-date-cell compare-header-cell" }, [
                  vue.createElementVNode("text", { class: "compare-header-text" }, "日期")
                ]),
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.allPlatformNames, (name) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "compare-cell compare-header-cell",
                      key: name
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "compare-header-text" },
                        vue.toDisplayString(name),
                        1
                        /* TEXT */
                      )
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.compareTableData, (row) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "compare-row",
                    key: row.id
                  }, [
                    vue.createElementVNode("view", { class: "compare-cell compare-date-cell" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "compare-date-text" },
                        vue.toDisplayString($setup.formatDate(row.date)),
                        1
                        /* TEXT */
                      )
                    ]),
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList($setup.allPlatformNames, (name) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: "compare-cell",
                          key: name
                        }, [
                          row.cells[name] && row.cells[name].amount !== null ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 0,
                            class: "cell-inner"
                          }, [
                            row.cells[name].change ? (vue.openBlock(), vue.createElementBlock(
                              "text",
                              {
                                key: 0,
                                class: vue.normalizeClass([
                                  "cell-arrow",
                                  row.cells[name].change.pct >= 0 ? "up" : "down"
                                ])
                              },
                              vue.toDisplayString(row.cells[name].change.pct >= 0 ? "▲" : "▼"),
                              3
                              /* TEXT, CLASS */
                            )) : vue.createCommentVNode("v-if", true),
                            vue.createElementVNode(
                              "text",
                              {
                                class: vue.normalizeClass([
                                  "cell-amount",
                                  row.cells[name].change ? row.cells[name].change.pct >= 0 ? "up" : "down" : ""
                                ])
                              },
                              "¥" + vue.toDisplayString($setup.formatNum(row.cells[name].amount)),
                              3
                              /* TEXT, CLASS */
                            )
                          ])) : (vue.openBlock(), vue.createElementBlock("text", {
                            key: 1,
                            class: "cell-empty"
                          }, "—"))
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" DELETE DIALOG "),
      $setup.deleteDialog.show ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "dialog-overlay",
        onClick: $setup.closeDelete
      }, [
        vue.createElementVNode("view", {
          class: "dialog-card",
          onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "dialog-icon-wrap" }, [
            vue.createElementVNode("text", { class: "dialog-icon" }, "✕")
          ]),
          vue.createElementVNode("text", { class: "dialog-title" }, "确认删除"),
          vue.createElementVNode(
            "text",
            { class: "dialog-msg" },
            " 确定要删除 " + vue.toDisplayString($setup.deleteDialog.item ? $setup.deleteDialog.item.date : "") + " 的快照记录吗？ ",
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "dialog-sub" }, "删除后无法恢复"),
          vue.createElementVNode("view", { class: "dialog-actions" }, [
            vue.createElementVNode("view", {
              class: "dialog-btn dialog-cancel",
              onClick: $setup.closeDelete
            }, [
              vue.createElementVNode("text", null, "取消")
            ]),
            vue.createElementVNode("view", {
              class: "dialog-btn dialog-confirm",
              onClick: $setup.doDelete
            }, [
              vue.createElementVNode("text", null, "删除")
            ])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/pages/index/index.vue"]]);
  const fontData = [
    {
      "font_class": "arrow-down",
      "unicode": ""
    },
    {
      "font_class": "arrow-left",
      "unicode": ""
    },
    {
      "font_class": "arrow-right",
      "unicode": ""
    },
    {
      "font_class": "arrow-up",
      "unicode": ""
    },
    {
      "font_class": "auth",
      "unicode": ""
    },
    {
      "font_class": "auth-filled",
      "unicode": ""
    },
    {
      "font_class": "back",
      "unicode": ""
    },
    {
      "font_class": "bars",
      "unicode": ""
    },
    {
      "font_class": "calendar",
      "unicode": ""
    },
    {
      "font_class": "calendar-filled",
      "unicode": ""
    },
    {
      "font_class": "camera",
      "unicode": ""
    },
    {
      "font_class": "camera-filled",
      "unicode": ""
    },
    {
      "font_class": "cart",
      "unicode": ""
    },
    {
      "font_class": "cart-filled",
      "unicode": ""
    },
    {
      "font_class": "chat",
      "unicode": ""
    },
    {
      "font_class": "chat-filled",
      "unicode": ""
    },
    {
      "font_class": "chatboxes",
      "unicode": ""
    },
    {
      "font_class": "chatboxes-filled",
      "unicode": ""
    },
    {
      "font_class": "chatbubble",
      "unicode": ""
    },
    {
      "font_class": "chatbubble-filled",
      "unicode": ""
    },
    {
      "font_class": "checkbox",
      "unicode": ""
    },
    {
      "font_class": "checkbox-filled",
      "unicode": ""
    },
    {
      "font_class": "checkmarkempty",
      "unicode": ""
    },
    {
      "font_class": "circle",
      "unicode": ""
    },
    {
      "font_class": "circle-filled",
      "unicode": ""
    },
    {
      "font_class": "clear",
      "unicode": ""
    },
    {
      "font_class": "close",
      "unicode": ""
    },
    {
      "font_class": "closeempty",
      "unicode": ""
    },
    {
      "font_class": "cloud-download",
      "unicode": ""
    },
    {
      "font_class": "cloud-download-filled",
      "unicode": ""
    },
    {
      "font_class": "cloud-upload",
      "unicode": ""
    },
    {
      "font_class": "cloud-upload-filled",
      "unicode": ""
    },
    {
      "font_class": "color",
      "unicode": ""
    },
    {
      "font_class": "color-filled",
      "unicode": ""
    },
    {
      "font_class": "compose",
      "unicode": ""
    },
    {
      "font_class": "contact",
      "unicode": ""
    },
    {
      "font_class": "contact-filled",
      "unicode": ""
    },
    {
      "font_class": "down",
      "unicode": ""
    },
    {
      "font_class": "bottom",
      "unicode": ""
    },
    {
      "font_class": "download",
      "unicode": ""
    },
    {
      "font_class": "download-filled",
      "unicode": ""
    },
    {
      "font_class": "email",
      "unicode": ""
    },
    {
      "font_class": "email-filled",
      "unicode": ""
    },
    {
      "font_class": "eye",
      "unicode": ""
    },
    {
      "font_class": "eye-filled",
      "unicode": ""
    },
    {
      "font_class": "eye-slash",
      "unicode": ""
    },
    {
      "font_class": "eye-slash-filled",
      "unicode": ""
    },
    {
      "font_class": "fire",
      "unicode": ""
    },
    {
      "font_class": "fire-filled",
      "unicode": ""
    },
    {
      "font_class": "flag",
      "unicode": ""
    },
    {
      "font_class": "flag-filled",
      "unicode": ""
    },
    {
      "font_class": "folder-add",
      "unicode": ""
    },
    {
      "font_class": "folder-add-filled",
      "unicode": ""
    },
    {
      "font_class": "font",
      "unicode": ""
    },
    {
      "font_class": "forward",
      "unicode": ""
    },
    {
      "font_class": "gear",
      "unicode": ""
    },
    {
      "font_class": "gear-filled",
      "unicode": ""
    },
    {
      "font_class": "gift",
      "unicode": ""
    },
    {
      "font_class": "gift-filled",
      "unicode": ""
    },
    {
      "font_class": "hand-down",
      "unicode": ""
    },
    {
      "font_class": "hand-down-filled",
      "unicode": ""
    },
    {
      "font_class": "hand-up",
      "unicode": ""
    },
    {
      "font_class": "hand-up-filled",
      "unicode": ""
    },
    {
      "font_class": "headphones",
      "unicode": ""
    },
    {
      "font_class": "heart",
      "unicode": ""
    },
    {
      "font_class": "heart-filled",
      "unicode": ""
    },
    {
      "font_class": "help",
      "unicode": ""
    },
    {
      "font_class": "help-filled",
      "unicode": ""
    },
    {
      "font_class": "home",
      "unicode": ""
    },
    {
      "font_class": "home-filled",
      "unicode": ""
    },
    {
      "font_class": "image",
      "unicode": ""
    },
    {
      "font_class": "image-filled",
      "unicode": ""
    },
    {
      "font_class": "images",
      "unicode": ""
    },
    {
      "font_class": "images-filled",
      "unicode": ""
    },
    {
      "font_class": "info",
      "unicode": ""
    },
    {
      "font_class": "info-filled",
      "unicode": ""
    },
    {
      "font_class": "left",
      "unicode": ""
    },
    {
      "font_class": "link",
      "unicode": ""
    },
    {
      "font_class": "list",
      "unicode": ""
    },
    {
      "font_class": "location",
      "unicode": ""
    },
    {
      "font_class": "location-filled",
      "unicode": ""
    },
    {
      "font_class": "locked",
      "unicode": ""
    },
    {
      "font_class": "locked-filled",
      "unicode": ""
    },
    {
      "font_class": "loop",
      "unicode": ""
    },
    {
      "font_class": "mail-open",
      "unicode": ""
    },
    {
      "font_class": "mail-open-filled",
      "unicode": ""
    },
    {
      "font_class": "map",
      "unicode": ""
    },
    {
      "font_class": "map-filled",
      "unicode": ""
    },
    {
      "font_class": "map-pin",
      "unicode": ""
    },
    {
      "font_class": "map-pin-ellipse",
      "unicode": ""
    },
    {
      "font_class": "medal",
      "unicode": ""
    },
    {
      "font_class": "medal-filled",
      "unicode": ""
    },
    {
      "font_class": "mic",
      "unicode": ""
    },
    {
      "font_class": "mic-filled",
      "unicode": ""
    },
    {
      "font_class": "micoff",
      "unicode": ""
    },
    {
      "font_class": "micoff-filled",
      "unicode": ""
    },
    {
      "font_class": "minus",
      "unicode": ""
    },
    {
      "font_class": "minus-filled",
      "unicode": ""
    },
    {
      "font_class": "more",
      "unicode": ""
    },
    {
      "font_class": "more-filled",
      "unicode": ""
    },
    {
      "font_class": "navigate",
      "unicode": ""
    },
    {
      "font_class": "navigate-filled",
      "unicode": ""
    },
    {
      "font_class": "notification",
      "unicode": ""
    },
    {
      "font_class": "notification-filled",
      "unicode": ""
    },
    {
      "font_class": "paperclip",
      "unicode": ""
    },
    {
      "font_class": "paperplane",
      "unicode": ""
    },
    {
      "font_class": "paperplane-filled",
      "unicode": ""
    },
    {
      "font_class": "person",
      "unicode": ""
    },
    {
      "font_class": "person-filled",
      "unicode": ""
    },
    {
      "font_class": "personadd",
      "unicode": ""
    },
    {
      "font_class": "personadd-filled",
      "unicode": ""
    },
    {
      "font_class": "personadd-filled-copy",
      "unicode": ""
    },
    {
      "font_class": "phone",
      "unicode": ""
    },
    {
      "font_class": "phone-filled",
      "unicode": ""
    },
    {
      "font_class": "plus",
      "unicode": ""
    },
    {
      "font_class": "plus-filled",
      "unicode": ""
    },
    {
      "font_class": "plusempty",
      "unicode": ""
    },
    {
      "font_class": "pulldown",
      "unicode": ""
    },
    {
      "font_class": "pyq",
      "unicode": ""
    },
    {
      "font_class": "qq",
      "unicode": ""
    },
    {
      "font_class": "redo",
      "unicode": ""
    },
    {
      "font_class": "redo-filled",
      "unicode": ""
    },
    {
      "font_class": "refresh",
      "unicode": ""
    },
    {
      "font_class": "refresh-filled",
      "unicode": ""
    },
    {
      "font_class": "refreshempty",
      "unicode": ""
    },
    {
      "font_class": "reload",
      "unicode": ""
    },
    {
      "font_class": "right",
      "unicode": ""
    },
    {
      "font_class": "scan",
      "unicode": ""
    },
    {
      "font_class": "search",
      "unicode": ""
    },
    {
      "font_class": "settings",
      "unicode": ""
    },
    {
      "font_class": "settings-filled",
      "unicode": ""
    },
    {
      "font_class": "shop",
      "unicode": ""
    },
    {
      "font_class": "shop-filled",
      "unicode": ""
    },
    {
      "font_class": "smallcircle",
      "unicode": ""
    },
    {
      "font_class": "smallcircle-filled",
      "unicode": ""
    },
    {
      "font_class": "sound",
      "unicode": ""
    },
    {
      "font_class": "sound-filled",
      "unicode": ""
    },
    {
      "font_class": "spinner-cycle",
      "unicode": ""
    },
    {
      "font_class": "staff",
      "unicode": ""
    },
    {
      "font_class": "staff-filled",
      "unicode": ""
    },
    {
      "font_class": "star",
      "unicode": ""
    },
    {
      "font_class": "star-filled",
      "unicode": ""
    },
    {
      "font_class": "starhalf",
      "unicode": ""
    },
    {
      "font_class": "trash",
      "unicode": ""
    },
    {
      "font_class": "trash-filled",
      "unicode": ""
    },
    {
      "font_class": "tune",
      "unicode": ""
    },
    {
      "font_class": "tune-filled",
      "unicode": ""
    },
    {
      "font_class": "undo",
      "unicode": ""
    },
    {
      "font_class": "undo-filled",
      "unicode": ""
    },
    {
      "font_class": "up",
      "unicode": ""
    },
    {
      "font_class": "top",
      "unicode": ""
    },
    {
      "font_class": "upload",
      "unicode": ""
    },
    {
      "font_class": "upload-filled",
      "unicode": ""
    },
    {
      "font_class": "videocam",
      "unicode": ""
    },
    {
      "font_class": "videocam-filled",
      "unicode": ""
    },
    {
      "font_class": "vip",
      "unicode": ""
    },
    {
      "font_class": "vip-filled",
      "unicode": ""
    },
    {
      "font_class": "wallet",
      "unicode": ""
    },
    {
      "font_class": "wallet-filled",
      "unicode": ""
    },
    {
      "font_class": "weibo",
      "unicode": ""
    },
    {
      "font_class": "weixin",
      "unicode": ""
    }
  ];
  const getVal = (val) => {
    const reg = /^[0-9]*$/g;
    return typeof val === "number" || reg.test(val) ? val + "px" : val;
  };
  const _sfc_main$7 = {
    name: "UniIcons",
    emits: ["click"],
    props: {
      type: {
        type: String,
        default: ""
      },
      color: {
        type: String,
        default: "#333333"
      },
      size: {
        type: [Number, String],
        default: 16
      },
      customPrefix: {
        type: String,
        default: ""
      },
      fontFamily: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        icons: fontData
      };
    },
    computed: {
      unicode() {
        let code = this.icons.find((v) => v.font_class === this.type);
        if (code) {
          return code.unicode;
        }
        return "";
      },
      iconSize() {
        return getVal(this.size);
      },
      styleObj() {
        if (this.fontFamily !== "") {
          return `color: ${this.color}; font-size: ${this.iconSize}; font-family: ${this.fontFamily};`;
        }
        return `color: ${this.color}; font-size: ${this.iconSize};`;
      }
    },
    methods: {
      _onClick(e) {
        this.$emit("click", e);
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "text",
      {
        style: vue.normalizeStyle($options.styleObj),
        class: vue.normalizeClass(["uni-icons", ["uniui-" + $props.type, $props.customPrefix, $props.customPrefix ? $props.type : ""]]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options._onClick && $options._onClick(...args))
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-d31e1c47"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const STORAGE_KEY$4 = "asset_snapshots";
  const _sfc_main$6 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const defaultPlatforms = [
        { name: "微信", desc: "社交支付", icon: "微", cls: "wechat" },
        { name: "支付宝", desc: "数字钱包", icon: "支", cls: "alipay" },
        { name: "招商银行", desc: "主卡银行", icon: "招", cls: "cmb" },
        { name: "同花顺", desc: "证券交易", icon: "花", cls: "cmb" },
        { name: "雪球", desc: "投资社区", icon: "雪", cls: "icbc" },
        { name: "涨乐通", desc: "华泰证券", icon: "涨", cls: "cmb" }
      ];
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const today = /* @__PURE__ */ new Date();
      const formDate = vue.ref(today.toISOString().slice(0, 10));
      let platformIdCounter = 0;
      const platforms = vue.ref([]);
      const screenshots = vue.ref([]);
      const note = vue.ref("");
      const pickerOpen = vue.ref(false);
      const customName = vue.ref("");
      const lastTotal = vue.ref(0);
      const savingImages = vue.ref(false);
      const showScreenshots = vue.ref(true);
      const showNote = vue.ref(true);
      function loadLastTotal() {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$4);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.sort((a, b) => {
              const dateCmp = b.date.localeCompare(a.date);
              if (dateCmp !== 0)
                return dateCmp;
              return (b.id || "").localeCompare(a.id || "");
            });
            const last = parsed[0];
            lastTotal.value = (last.platforms || []).reduce(
              (s, p) => s + (parseFloat(p.amount) || 0),
              0
            );
            if ((last.platforms || []).length > 0) {
              platforms.value = last.platforms.map((p) => ({
                id: ++platformIdCounter,
                name: p.name,
                desc: p.desc || "",
                icon: p.icon || p.name[0],
                cls: p.cls || "default",
                amount: ""
              }));
              return;
            }
          }
          platforms.value = [
            {
              id: ++platformIdCounter,
              name: "支付宝",
              desc: "数字钱包",
              icon: "支",
              cls: "alipay",
              amount: ""
            },
            {
              id: ++platformIdCounter,
              name: "招商银行",
              desc: "主卡银行",
              icon: "招",
              cls: "cmb",
              amount: ""
            }
          ];
        } catch (e) {
          platforms.value = [
            {
              id: ++platformIdCounter,
              name: "支付宝",
              desc: "数字钱包",
              icon: "支",
              cls: "alipay",
              amount: ""
            },
            {
              id: ++platformIdCounter,
              name: "招商银行",
              desc: "主卡银行",
              icon: "招",
              cls: "cmb",
              amount: ""
            }
          ];
        }
      }
      onLoad(loadLastTotal);
      const dateDisplay = vue.computed(() => {
        const d = new Date(formDate.value);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y} · ${m} · ${day}`;
      });
      const weekdayDisplay = vue.computed(() => {
        const d = new Date(formDate.value);
        return weekdays[d.getDay()];
      });
      function onDateChange(e) {
        formDate.value = e.detail.value;
      }
      const addedPlatformNames = vue.computed(() => {
        const set = /* @__PURE__ */ new Set();
        platforms.value.forEach((p) => set.add(p.name));
        return set;
      });
      function openPicker() {
        customName.value = "";
        pickerOpen.value = true;
      }
      function closePicker() {
        pickerOpen.value = false;
      }
      function selectDefaultPlatform(p) {
        if (addedPlatformNames.value.has(p.name))
          return;
        platforms.value.push({
          id: ++platformIdCounter,
          name: p.name,
          desc: p.desc,
          icon: p.icon,
          cls: p.cls,
          amount: ""
        });
        closePicker();
      }
      function addCustomPlatform() {
        const name = customName.value.trim();
        if (!name || addedPlatformNames.value.has(name))
          return;
        const colors = ["wechat", "alipay", "cmb", "icbc"];
        const cls = colors[Math.floor(Math.random() * colors.length)];
        platforms.value.push({
          id: ++platformIdCounter,
          name,
          desc: "自定义",
          icon: name[0],
          cls,
          amount: ""
        });
        customName.value = "";
        closePicker();
      }
      function removePlatform(index) {
        platforms.value.splice(index, 1);
      }
      const totalAmount = vue.computed(() => {
        return platforms.value.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      });
      const totalChange = vue.computed(() => {
        const total = totalAmount.value;
        if (platforms.value.length === 0)
          return null;
        const diff = total - lastTotal.value;
        const pct = lastTotal.value > 0 ? diff / lastTotal.value * 100 : 0;
        return { diff, pct };
      });
      function formatNum(n) {
        const num = parseFloat(n) || 0;
        const parts = num.toFixed(2).split(".");
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const decPart = parts[1];
        return decPart === "00" ? intPart : intPart + "." + decPart.replace(/0+$/, "");
      }
      function chooseImage() {
        uni.chooseImage({
          count: 9,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res) => {
            savingImages.value = true;
            let pending = res.tempFilePaths.length;
            res.tempFilePaths.forEach(function(tempPath) {
              uni.saveFile({
                tempFilePath: tempPath,
                success: function(saveRes) {
                  screenshots.value.push(saveRes.savedFilePath);
                },
                fail: function() {
                  screenshots.value.push(tempPath);
                },
                complete: function() {
                  pending--;
                  if (pending <= 0)
                    savingImages.value = false;
                }
              });
            });
          }
        });
      }
      function removeScreenshot(index) {
        screenshots.value.splice(index, 1);
      }
      function previewImage(index) {
        uni.previewImage({
          urls: screenshots.value,
          current: screenshots.value[index]
        });
      }
      function goBack() {
        uni.navigateBack();
      }
      function saveSnapshot() {
        if (savingImages.value) {
          uni.showToast({
            title: "图片保存中，请稍候",
            mask: true,
            icon: "none"
          });
          return;
        }
        if (platforms.value.length === 0) {
          uni.showToast({
            title: "请添加记录",
            mask: true,
            icon: "none"
          });
          return;
        }
        const snapshot = {
          id: Date.now().toString(),
          date: formDate.value,
          platforms: platforms.value.map(function(p) {
            return {
              name: p.name,
              desc: p.desc,
              icon: p.icon,
              cls: p.cls,
              amount: parseFloat(p.amount) || 0
            };
          }),
          screenshots: screenshots.value,
          note: note.value.trim()
        };
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$4);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          const arr = Array.isArray(parsed) ? parsed : [];
          arr.push(snapshot);
          const dataStr = JSON.stringify(arr);
          uni.setStorage({
            key: STORAGE_KEY$4,
            data: dataStr,
            success: function() {
              uni.showToast({ title: "已保存", icon: "success" });
              setTimeout(function() {
                uni.navigateBack();
              }, 800);
            },
            fail: function(err) {
              formatAppLog("error", "at pages/add/index.vue:474", "保存失败:", err);
              uni.showToast({
                title: "保存失败: " + (err.errMsg || "存储空间不足"),
                icon: "none",
                duration: 3e3
              });
            }
          });
        } catch (e) {
          formatAppLog("error", "at pages/add/index.vue:483", "保存异常:", e);
          uni.showToast({
            title: "保存失败: " + (e.message || "未知错误"),
            icon: "none",
            duration: 3e3
          });
        }
      }
      const __returned__ = { STORAGE_KEY: STORAGE_KEY$4, defaultPlatforms, weekdays, today, formDate, get platformIdCounter() {
        return platformIdCounter;
      }, set platformIdCounter(v) {
        platformIdCounter = v;
      }, platforms, screenshots, note, pickerOpen, customName, lastTotal, savingImages, showScreenshots, showNote, loadLastTotal, dateDisplay, weekdayDisplay, onDateChange, addedPlatformNames, openPicker, closePicker, selectDefaultPlatform, addCustomPlatform, removePlatform, totalAmount, totalChange, formatNum, chooseImage, removeScreenshot, previewImage, goBack, saveSnapshot, ref: vue.ref, computed: vue.computed, get onLoad() {
        return onLoad;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" HEADER "),
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode("view", { class: "header-inner" }, [
          vue.createElementVNode("view", {
            class: "header-back",
            onClick: $setup.goBack
          }, [
            vue.createElementVNode("text", { class: "back-arrow" }, [
              vue.createVNode(_component_uni_icons, { type: "arrow-left" })
            ]),
            vue.createElementVNode("text", { class: "back-text" }, "返回")
          ]),
          vue.createElementVNode("view", { class: "header-date" }, [
            vue.createElementVNode("picker", {
              mode: "date",
              value: $setup.formDate,
              onChange: $setup.onDateChange
            }, [
              vue.createElementVNode("view", { class: "header-date-btn" }, [
                vue.createElementVNode(
                  "text",
                  { class: "header-date-text" },
                  vue.toDisplayString($setup.dateDisplay),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "header-date-weekday" },
                  vue.toDisplayString($setup.weekdayDisplay),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "header-date-arrow" }, "▸")
              ])
            ], 40, ["value"])
          ])
        ])
      ]),
      vue.createCommentVNode(" MAIN "),
      vue.createElementVNode("view", { class: "main" }, [
        vue.createCommentVNode(" Total Bar inline "),
        vue.createElementVNode("view", { class: "total-inline" }, [
          vue.createElementVNode("text", { class: "total-inline-label" }, "总计"),
          vue.createElementVNode(
            "text",
            { class: "total-inline-amount" },
            "¥" + vue.toDisplayString($setup.formatNum($setup.totalAmount)),
            1
            /* TEXT */
          ),
          $setup.totalChange ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: vue.normalizeClass([
                "total-inline-badge",
                $setup.totalChange.pct >= 0 ? "up" : "down"
              ])
            },
            [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($setup.totalChange.pct >= 0 ? "▲" : "▼"),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($setup.totalChange.pct >= 0 ? "+" : "") + vue.toDisplayString($setup.totalChange.pct.toFixed(1)) + "%",
                1
                /* TEXT */
              )
            ],
            2
            /* CLASS */
          )) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createCommentVNode(" Platforms "),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", { class: "section-label" }, [
            vue.createElementVNode("text", { class: "section-label-text" }, "平台资产"),
            vue.createElementVNode("view", { class: "section-label-line" })
          ]),
          vue.createElementVNode("view", { class: "platform-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.platforms, (p, i) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "platform-row",
                  key: p.id
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["platform-icon", p.cls])
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "platform-icon-text" },
                        vue.toDisplayString(p.icon),
                        1
                        /* TEXT */
                      )
                    ],
                    2
                    /* CLASS */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "platform-name" },
                    vue.toDisplayString(p.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "amount-input-wrapper" }, [
                    vue.createElementVNode("text", { class: "amount-prefix" }, "¥"),
                    vue.withDirectives(vue.createElementVNode("input", {
                      type: "digit",
                      class: "amount-input",
                      placeholder: "0.00",
                      "onUpdate:modelValue": ($event) => p.amount = $event
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vue.vModelText, p.amount]
                    ])
                  ]),
                  vue.createElementVNode("view", {
                    class: "platform-delete",
                    onClick: ($event) => $setup.removePlatform(i)
                  }, [
                    vue.createElementVNode("text", { class: "delete-icon" }, "✕")
                  ], 8, ["onClick"])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          $setup.platforms.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty-hint"
          }, [
            vue.createElementVNode("text", { class: "empty-hint-text" }, "点击下方「+ 添加平台」开始记录")
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", {
            class: "add-platform-btn",
            onClick: $setup.openPicker
          }, [
            vue.createElementVNode("text", { class: "add-icon" }, "+"),
            vue.createElementVNode("text", { class: "add-text" }, "添加平台")
          ])
        ]),
        vue.createCommentVNode(" Collapsible: Screenshots "),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", {
            class: "collapse-header",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.showScreenshots = !$setup.showScreenshots)
          }, [
            vue.createElementVNode("text", { class: "section-label-text" }, "截图凭证"),
            $setup.screenshots.length > 0 ? (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 0,
                class: "collapse-count"
              },
              vue.toDisplayString($setup.screenshots.length),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "section-label-line" }),
            vue.createElementVNode(
              "text",
              {
                class: vue.normalizeClass(["collapse-arrow", $setup.showScreenshots ? "open" : ""])
              },
              "▾",
              2
              /* CLASS */
            )
          ]),
          vue.withDirectives(vue.createElementVNode(
            "view",
            { class: "collapse-body" },
            [
              vue.createElementVNode("view", { class: "upload-grid" }, [
                vue.createElementVNode("view", {
                  class: "upload-trigger",
                  onClick: $setup.chooseImage
                }, [
                  vue.createElementVNode("text", { class: "upload-icon" }, [
                    vue.createVNode(_component_uni_icons, {
                      type: "cloud-upload",
                      size: "25"
                    })
                  ]),
                  vue.createElementVNode("text", { class: "upload-text" }, "上传")
                ]),
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.screenshots, (img, i) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "upload-thumb",
                      key: img
                    }, [
                      vue.createElementVNode("image", {
                        src: img,
                        mode: "aspectFill",
                        onClick: ($event) => $setup.previewImage(i)
                      }, null, 8, ["src", "onClick"]),
                      vue.createElementVNode("view", {
                        class: "thumb-delete",
                        onClick: vue.withModifiers(($event) => $setup.removeScreenshot(i), ["stop"])
                      }, [
                        vue.createElementVNode("text", { class: "thumb-delete-icon" }, "✕")
                      ], 8, ["onClick"])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ],
            512
            /* NEED_PATCH */
          ), [
            [vue.vShow, $setup.showScreenshots]
          ])
        ]),
        vue.createCommentVNode(" Collapsible: Note "),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("view", {
            class: "collapse-header",
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.showNote = !$setup.showNote)
          }, [
            vue.createElementVNode("text", { class: "section-label-text" }, "备注"),
            vue.createElementVNode("view", { class: "section-label-line" }),
            vue.createElementVNode(
              "text",
              {
                class: vue.normalizeClass(["collapse-arrow", $setup.showNote ? "open" : ""])
              },
              "▾",
              2
              /* CLASS */
            )
          ]),
          vue.withDirectives(vue.createElementVNode(
            "view",
            { class: "collapse-body" },
            [
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  class: "note-input",
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.note = $event),
                  placeholder: "记录一下这次的变化原因…"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.note]
              ])
            ],
            512
            /* NEED_PATCH */
          ), [
            [vue.vShow, $setup.showNote]
          ])
        ])
      ]),
      vue.createCommentVNode(" SUBMIT FOOTER "),
      vue.createElementVNode("view", { class: "submit-footer" }, [
        vue.createElementVNode("view", { class: "submit-inner" }, [
          vue.createElementVNode("view", {
            class: "btn-cancel",
            onClick: $setup.goBack
          }, [
            vue.createElementVNode("text", { class: "btn-cancel-text" }, "取消")
          ]),
          vue.createElementVNode("view", {
            class: "btn-submit",
            onClick: $setup.saveSnapshot
          }, [
            vue.createElementVNode("text", { class: "btn-submit-text" }, "保存快照")
          ])
        ])
      ]),
      vue.createCommentVNode(" PLATFORM PICKER MODAL "),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["picker-overlay", $setup.pickerOpen ? "open" : ""]),
          onClick: $setup.closePicker
        },
        null,
        2
        /* CLASS */
      ),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["picker-sheet", $setup.pickerOpen ? "open" : ""])
        },
        [
          vue.createElementVNode("view", { class: "picker-handle" }),
          vue.createElementVNode("text", { class: "picker-title" }, "选择平台"),
          vue.createElementVNode("text", { class: "picker-subtitle" }, "点击添加，或输入自定义平台名称"),
          vue.createElementVNode("view", { class: "picker-grid" }, [
            (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.defaultPlatforms, (p) => {
                return vue.createElementVNode("view", {
                  class: vue.normalizeClass([
                    "picker-option",
                    $setup.addedPlatformNames.has(p.name) ? "selected" : ""
                  ]),
                  key: p.name,
                  onClick: ($event) => $setup.selectDefaultPlatform(p)
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["icon", "platform-icon", p.cls])
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "platform-icon-text" },
                        vue.toDisplayString(p.icon),
                        1
                        /* TEXT */
                      )
                    ],
                    2
                    /* CLASS */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "picker-label" },
                    vue.toDisplayString(p.name) + vue.toDisplayString($setup.addedPlatformNames.has(p.name) ? " ✓" : ""),
                    1
                    /* TEXT */
                  )
                ], 10, ["onClick"]);
              }),
              64
              /* STABLE_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "picker-custom-row" }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "picker-custom-input",
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.customName = $event),
                placeholder: "自定义平台名称…",
                onConfirm: $setup.addCustomPlatform
              },
              null,
              544
              /* NEED_HYDRATION, NEED_PATCH */
            ), [
              [vue.vModelText, $setup.customName]
            ]),
            vue.createElementVNode("view", {
              class: "picker-custom-btn",
              onClick: $setup.addCustomPlatform
            }, [
              vue.createElementVNode("text", { class: "picker-custom-btn-text" }, "添加")
            ])
          ]),
          vue.createElementVNode("view", {
            class: "picker-cancel",
            onClick: $setup.closePicker
          }, [
            vue.createElementVNode("text", { class: "picker-cancel-text" }, "取消")
          ])
        ],
        2
        /* CLASS */
      )
    ]);
  }
  const PagesAddIndex = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-89f6901d"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/pages/add/index.vue"]]);
  const _sfc_main$5 = {
    __name: "GachaNav",
    props: {
      active: { type: String, default: "" }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      function goPage(url) {
        uni.redirectTo({ url });
      }
      const __returned__ = { goPage };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = resolveEasycom(vue.resolveDynamicComponent("uni-icons"), __easycom_0);
    return vue.openBlock(), vue.createElementBlock("view", { class: "bottom-nav" }, [
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["nav-item", $props.active === "list" ? "active" : ""]),
          onClick: _cache[0] || (_cache[0] = ($event) => $props.active !== "list" && $setup.goPage("/pages/gacha/list/index"))
        },
        [
          vue.createVNode(_component_uni_icons, {
            type: "bars",
            size: "20",
            color: $props.active === "list" ? "#c45d3e" : "#a0a0a0"
          }, null, 8, ["color"]),
          vue.createElementVNode("text", { class: "nav-label" }, "活动")
        ],
        2
        /* CLASS */
      ),
      vue.createElementVNode(
        "view",
        {
          class: vue.normalizeClass(["nav-item", $props.active === "history" ? "active" : ""]),
          onClick: _cache[1] || (_cache[1] = ($event) => $props.active !== "history" && $setup.goPage("/pages/gacha/history/index"))
        },
        [
          vue.createVNode(_component_uni_icons, {
            type: "refresh-filled",
            size: "20",
            color: $props.active === "history" ? "#c45d3e" : "#a0a0a0"
          }, null, 8, ["color"]),
          vue.createElementVNode("text", { class: "nav-label" }, "历史")
        ],
        2
        /* CLASS */
      )
    ]);
  }
  const GachaNav = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-8534a157"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/components/GachaNav.vue"]]);
  const STORAGE_KEY$3 = "gacha_activities";
  const _sfc_main$4 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const DEMO_ACTIVITIES = [
        {
          id: "demo_1",
          name: "每日幸运星",
          description: "每日抽奖，赢取精彩好礼",
          emoji: "⭐",
          coverGradient: "linear-gradient(135deg, #fdf0ef 0%, #fde8e4 50%, #fbeee0 100%)",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          prizes: [
            { id: "d1p1", name: "限量版数字藏品", rarity: "LEGENDARY", emoji: "👑" },
            { id: "d1p2", name: "星辰幻镜之球", rarity: "EPIC", emoji: "💎" },
            { id: "d1p3", name: "远古密匣钥匙", rarity: "RARE", emoji: "🗝️" },
            { id: "d1p4", name: "金币福袋", rarity: "COMMON", emoji: "🪙" },
            { id: "d1p5", name: "碎星矿石", rarity: "COMMON", emoji: "✨" }
          ],
          drawnPrizeIds: ["d1p4"]
        },
        {
          id: "demo_2",
          name: "超级翻翻乐",
          description: "翻转卡牌，惊喜不断",
          emoji: "🎴",
          coverGradient: "linear-gradient(135deg, #f0f9f4 0%, #e4f5eb 50%, #eef7f0 100%)",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          prizes: [
            { id: "d2p1", name: "不灭凤凰之魂", rarity: "LEGENDARY", emoji: "🔥" },
            { id: "d2p2", name: "暗影刺客装备", rarity: "EPIC", emoji: "🗡️" },
            { id: "d2p3", name: "神秘宝箱钥匙", rarity: "RARE", emoji: "🔑" },
            { id: "d2p4", name: "经验药水", rarity: "COMMON", emoji: "🧪" }
          ],
          drawnPrizeIds: []
        }
      ];
      const activities = vue.ref([]);
      const delDialog = vue.ref({ show: false, id: "", name: "" });
      const openMenuId = vue.ref(null);
      function toggleMenu(id) {
        openMenuId.value = openMenuId.value === id ? null : id;
      }
      function loadActivities() {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$3);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          activities.value = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          activities.value = [];
        }
        if (activities.value.length === 0) {
          activities.value = JSON.parse(JSON.stringify(DEMO_ACTIVITIES));
          saveActivities();
        }
      }
      function saveActivities() {
        uni.setStorageSync(STORAGE_KEY$3, JSON.stringify(activities.value));
      }
      function getDrawnPrizeIds(arr) {
        return (arr || []).map(
          (item) => typeof item === "string" ? item : item.prizeId
        );
      }
      function formatDate(iso) {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
      function drawnCount(act) {
        return getDrawnPrizeIds(act.drawnPrizeIds).length;
      }
      function actProgress(act) {
        if (!act.prizes || act.prizes.length === 0)
          return 0;
        return Math.round(
          getDrawnPrizeIds(act.drawnPrizeIds).length / act.prizes.length * 100
        );
      }
      function goCreate() {
        uni.navigateTo({ url: "/pages/gacha/create/index" });
      }
      function goEdit(id) {
        uni.navigateTo({ url: "/pages/gacha/create/index?editId=" + id });
      }
      function goDraw(id) {
        uni.navigateTo({ url: "/pages/gacha/draw/index?id=" + id });
      }
      function goBack() {
        uni.navigateBack();
      }
      function confirmDelete(act) {
        delDialog.value = { show: true, id: act.id, name: act.name };
      }
      function closeDel() {
        delDialog.value = { show: false, id: "", name: "" };
      }
      function doDelete() {
        const idx = activities.value.findIndex((a) => a.id === delDialog.value.id);
        if (idx > -1) {
          activities.value.splice(idx, 1);
          saveActivities();
          uni.showToast({ title: "已删除", icon: "success" });
        }
        closeDel();
      }
      onShow(() => {
        loadActivities();
      });
      const __returned__ = { STORAGE_KEY: STORAGE_KEY$3, DEMO_ACTIVITIES, activities, delDialog, openMenuId, toggleMenu, loadActivities, saveActivities, getDrawnPrizeIds, formatDate, drawnCount, actProgress, goCreate, goEdit, goDraw, goBack, confirmDelete, closeDel, doDelete, ref: vue.ref, get onShow() {
        return onShow;
      }, GachaNav };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" Header "),
      vue.createElementVNode("view", { class: "gacha-header" }, [
        vue.createElementVNode("view", { class: "header-left" }, [
          vue.createElementVNode("text", {
            class: "back-btn",
            onClick: $setup.goBack
          }, "←"),
          vue.createElementVNode("text", { class: "header-title" }, "抽卡活动")
        ]),
        vue.createElementVNode("view", { class: "header-right" })
      ]),
      vue.createCommentVNode(" Hero "),
      vue.createElementVNode("view", { class: "hero-section" }, [
        vue.createElementVNode("text", { class: "hero-heading" }, "我的抽卡活动"),
        vue.createElementVNode("text", { class: "hero-desc" }, "探索正在进行的精彩抽卡")
      ]),
      vue.createCommentVNode(" Activity Grid "),
      $setup.activities.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "activity-grid"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.activities, (act) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "activity-card",
              key: act.id,
              onClick: ($event) => $setup.goDraw(act.id)
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: "card-cover",
                  style: vue.normalizeStyle(act.coverImage ? {} : { background: act.coverGradient || "#f5f2ed" })
                },
                [
                  act.coverImage ? (vue.openBlock(), vue.createElementBlock("image", {
                    key: 0,
                    src: act.coverImage,
                    mode: "aspectFill",
                    class: "cover-img"
                  }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 1,
                      class: "cover-emoji"
                    },
                    vue.toDisplayString(act.emoji || "🎴"),
                    1
                    /* TEXT */
                  ))
                ],
                4
                /* STYLE */
              ),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "card-name-row" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "card-name" },
                    vue.toDisplayString(act.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", {
                    class: "card-menu-btn",
                    onClick: vue.withModifiers(($event) => $setup.toggleMenu(act.id), ["stop"])
                  }, "⋯", 8, ["onClick"])
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "card-desc" },
                  vue.toDisplayString(act.description),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "progress-wrap" }, [
                  vue.createElementVNode("view", { class: "progress-track" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "progress-fill",
                        style: vue.normalizeStyle({ width: $setup.actProgress(act) + "%" })
                      },
                      null,
                      4
                      /* STYLE */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "card-meta" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "meta-text" },
                    "进度 " + vue.toDisplayString($setup.actProgress(act)) + "%",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "meta-text" },
                    vue.toDisplayString($setup.drawnCount(act)) + "/" + vue.toDisplayString(act.prizes.length) + " 已抽",
                    1
                    /* TEXT */
                  )
                ]),
                act.createdAt ? (vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: 0,
                    class: "card-date"
                  },
                  vue.toDisplayString($setup.formatDate(act.createdAt)),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true),
                $setup.openMenuId === act.id ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "card-menu"
                }, [
                  vue.createElementVNode("text", {
                    class: "card-edit",
                    onClick: vue.withModifiers(($event) => $setup.goEdit(act.id), ["stop"])
                  }, "编辑", 8, ["onClick"]),
                  vue.createElementVNode("text", {
                    class: "card-delete",
                    onClick: vue.withModifiers(($event) => $setup.confirmDelete(act), ["stop"])
                  }, "删除", 8, ["onClick"])
                ])) : vue.createCommentVNode("v-if", true)
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createCommentVNode(" Empty State "),
          vue.createElementVNode("view", { class: "empty-state" }, [
            vue.createElementVNode("text", { class: "empty-icon" }, "🎴"),
            vue.createElementVNode("text", { class: "empty-text" }, "暂无抽卡活动"),
            vue.createElementVNode("text", { class: "empty-hint" }, "点击右下角 + 创建新活动")
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )),
      vue.createCommentVNode(" FAB "),
      vue.createElementVNode("view", {
        class: "fab",
        onClick: $setup.goCreate
      }, [
        vue.createElementVNode("text", { class: "fab-icon" }, "+")
      ]),
      vue.createCommentVNode(" Delete Dialog "),
      $setup.delDialog.show ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "del-overlay",
        onClick: $setup.closeDel
      }, [
        vue.createElementVNode("view", {
          class: "del-card",
          onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "del-icon-wrap" }, [
            vue.createElementVNode("text", { class: "del-icon" }, "✕")
          ]),
          vue.createElementVNode("text", { class: "del-title" }, "确认删除"),
          vue.createElementVNode(
            "text",
            { class: "del-msg" },
            "确定要删除活动「" + vue.toDisplayString($setup.delDialog.name) + "」吗？",
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "del-sub" }, "删除后无法恢复，已抽中的奖品记录将丢失"),
          vue.createElementVNode("view", { class: "del-actions" }, [
            vue.createElementVNode("view", {
              class: "del-btn del-cancel",
              onClick: $setup.closeDel
            }, [
              vue.createElementVNode("text", null, "取消")
            ]),
            vue.createElementVNode("view", {
              class: "del-btn del-confirm",
              onClick: $setup.doDelete
            }, [
              vue.createElementVNode("text", null, "删除")
            ])
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode($setup["GachaNav"], { active: "list" })
    ]);
  }
  const PagesGachaListIndex = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-889aeb45"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/pages/gacha/list/index.vue"]]);
  const STORAGE_KEY$2 = "gacha_activities";
  const _sfc_main$3 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const RARITY_LABELS = {
        LEGENDARY: "传说",
        EPIC: "史诗",
        RARE: "稀有",
        COMMON: "普通"
      };
      function getDrawnPrizeIds(arr) {
        return (arr || []).map(
          (item) => typeof item === "string" ? item : item.prizeId
        );
      }
      function formatTime(iso) {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}`;
      }
      const activity = vue.ref(null);
      const isDrawing = vue.ref(false);
      const showResult = vue.ref(false);
      const lastPrize = vue.ref(null);
      const recentDrawn = vue.ref([]);
      const remainingCount = vue.computed(() => {
        if (!activity.value)
          return 0;
        const total = activity.value.prizes.length;
        const drawn = getDrawnPrizeIds(activity.value.drawnPrizeIds).length;
        return total - drawn;
      });
      function loadActivity(id) {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$2);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          const activities = Array.isArray(parsed) ? parsed : [];
          activity.value = activities.find((a) => a.id === id) || null;
          if (activity.value) {
            const drawnRecords = activity.value.drawnPrizeIds || [];
            const drawnIds = getDrawnPrizeIds(drawnRecords);
            const idToRecord = {};
            drawnRecords.forEach((r) => {
              idToRecord[typeof r === "string" ? r : r.prizeId] = typeof r === "string" ? null : r;
            });
            recentDrawn.value = activity.value.prizes.filter((p) => drawnIds.includes(p.id)).slice(-5).reverse().map((p) => {
              const record = idToRecord[p.id];
              return { ...p, drawnAt: record ? record.drawnAt : null };
            });
          }
        } catch (e) {
          activity.value = null;
        }
      }
      function saveActivity() {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$2);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          const activities = Array.isArray(parsed) ? parsed : [];
          const idx = activities.findIndex((a) => a.id === activity.value.id);
          if (idx > -1) {
            activities[idx] = activity.value;
            uni.setStorageSync(STORAGE_KEY$2, JSON.stringify(activities));
          }
        } catch (e) {
        }
      }
      function doDraw() {
        if (isDrawing.value)
          return;
        if (remainingCount.value <= 0) {
          uni.showToast({ title: "奖品已全部抽完", icon: "none" });
          return;
        }
        isDrawing.value = true;
        const drawnRecords = activity.value.drawnPrizeIds || [];
        const drawnIds = getDrawnPrizeIds(drawnRecords);
        const available = activity.value.prizes.filter(
          (p) => !drawnIds.includes(p.id)
        );
        const picked = available[Math.floor(Math.random() * available.length)];
        setTimeout(() => {
          const now = (/* @__PURE__ */ new Date()).toISOString();
          activity.value.drawnPrizeIds.push({ prizeId: picked.id, drawnAt: now });
          saveActivity();
          lastPrize.value = picked;
          showResult.value = true;
          isDrawing.value = false;
          recentDrawn.value.unshift({ ...picked, drawnAt: now });
          if (recentDrawn.value.length > 5) {
            recentDrawn.value = recentDrawn.value.slice(0, 5);
          }
        }, 600);
      }
      function previewPrizeImage() {
        if (lastPrize.value && lastPrize.value.image) {
          uni.previewImage({
            urls: [lastPrize.value.image],
            current: lastPrize.value.image
          });
        }
      }
      function closeResult() {
        showResult.value = false;
      }
      function goBack() {
        uni.navigateBack();
      }
      function rarityClass(rarity) {
        const map = {
          LEGENDARY: "rarity-legendary",
          EPIC: "rarity-epic",
          RARE: "rarity-rare",
          COMMON: "rarity-common"
        };
        return map[rarity] || "";
      }
      onLoad((options) => {
        if (options && options.id) {
          loadActivity(options.id);
        }
      });
      const __returned__ = { STORAGE_KEY: STORAGE_KEY$2, RARITY_LABELS, getDrawnPrizeIds, formatTime, activity, isDrawing, showResult, lastPrize, recentDrawn, remainingCount, loadActivity, saveActivity, doDraw, previewPrizeImage, closeResult, goBack, rarityClass, ref: vue.ref, computed: vue.computed, get onLoad() {
        return onLoad;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" Header "),
      vue.createElementVNode("view", { class: "gacha-header" }, [
        vue.createElementVNode("view", { class: "header-left" }, [
          vue.createElementVNode("text", {
            class: "back-btn",
            onClick: $setup.goBack
          }, "←"),
          vue.createElementVNode(
            "text",
            { class: "header-title" },
            vue.toDisplayString($setup.activity ? $setup.activity.name : "幸运抽卡"),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "header-right" }, [
          $setup.activity && $setup.remainingCount > 0 ? (vue.openBlock(), vue.createElementBlock("text", {
            key: 0,
            class: "status-badge"
          }, "进行中")) : $setup.activity ? (vue.openBlock(), vue.createElementBlock("text", {
            key: 1,
            class: "status-badge ended"
          }, "已抽完")) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      vue.createCommentVNode(" No Activity Selected "),
      !$setup.activity ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "no-activity"
      }, [
        vue.createElementVNode("text", { class: "na-icon" }, "🎴"),
        vue.createElementVNode("text", { class: "na-text" }, "请先从活动列表选择一个活动"),
        vue.createElementVNode("view", {
          class: "na-btn",
          onClick: $setup.goBack
        }, [
          vue.createElementVNode("text", null, "返回活动列表")
        ])
      ])) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createCommentVNode(" Draw Area "),
          vue.createElementVNode("view", { class: "draw-area" }, [
            vue.createCommentVNode(" Activity Cover "),
            $setup.activity.coverImage ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "draw-cover"
            }, [
              vue.createElementVNode("image", {
                src: $setup.activity.coverImage,
                mode: "aspectFill",
                class: "draw-cover-img"
              }, null, 8, ["src"])
            ])) : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" Activity Info "),
            vue.createElementVNode("view", { class: "info-bar" }, [
              vue.createElementVNode(
                "text",
                { class: "info-text" },
                vue.toDisplayString($setup.activity.description),
                1
                /* TEXT */
              )
            ]),
            vue.createCommentVNode(" Mystery Box "),
            vue.createElementVNode("view", { class: "box-container" }, [
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["box-glow", { "is-drawing": $setup.isDrawing }])
                },
                null,
                2
                /* CLASS */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["mystery-box", { "is-drawing": $setup.isDrawing }]),
                  onClick: $setup.doDraw
                },
                [
                  vue.createElementVNode("view", { class: "box-inner" }, [
                    vue.createElementVNode("view", { class: "orb" }, [
                      vue.createElementVNode("view", { class: "orb-highlight" }),
                      vue.createElementVNode(
                        "text",
                        { class: "orb-emoji" },
                        vue.toDisplayString($setup.remainingCount > 0 ? "🎁" : "📭"),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "box-label" },
                      vue.toDisplayString($setup.remainingCount > 0 ? "点击抽取" : "已全部抽完"),
                      1
                      /* TEXT */
                    )
                  ])
                ],
                2
                /* CLASS */
              )
            ]),
            vue.createCommentVNode(" Draw Stats "),
            vue.createElementVNode("view", { class: "draw-stats" }, [
              vue.createElementVNode("view", { class: "stat-item" }, [
                vue.createElementVNode("text", { class: "stat-label" }, "剩余奖品"),
                vue.createElementVNode(
                  "text",
                  { class: "stat-num" },
                  vue.toDisplayString($setup.remainingCount) + " / " + vue.toDisplayString($setup.activity.prizes.length),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "stat-divider" }),
              vue.createElementVNode("view", { class: "stat-item" }, [
                vue.createElementVNode("text", { class: "stat-label" }, "已抽取"),
                vue.createElementVNode(
                  "text",
                  { class: "stat-num" },
                  vue.toDisplayString($setup.activity.drawnPrizeIds.length) + " 件",
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createCommentVNode(" Recently Drawn "),
            $setup.recentDrawn.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "recent-section"
            }, [
              vue.createElementVNode("text", { class: "recent-title" }, "最近抽中"),
              vue.createElementVNode("view", { class: "recent-list" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.recentDrawn, (prize, idx) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "recent-item",
                      key: idx
                    }, [
                      prize.image ? (vue.openBlock(), vue.createElementBlock("image", {
                        key: 0,
                        src: prize.image,
                        mode: "aspectFill",
                        class: "recent-img"
                      }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock(
                        "text",
                        {
                          key: 1,
                          class: "recent-emoji"
                        },
                        vue.toDisplayString(prize.emoji || "🎁"),
                        1
                        /* TEXT */
                      )),
                      vue.createElementVNode("view", { class: "recent-info" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "recent-name" },
                          vue.toDisplayString(prize.name),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode("view", { class: "recent-bottom" }, [
                          vue.createElementVNode(
                            "text",
                            {
                              class: vue.normalizeClass(["recent-rarity", $setup.rarityClass(prize.rarity)])
                            },
                            vue.toDisplayString($setup.RARITY_LABELS[prize.rarity] || prize.rarity),
                            3
                            /* TEXT, CLASS */
                          ),
                          prize.drawnAt ? (vue.openBlock(), vue.createElementBlock(
                            "text",
                            {
                              key: 0,
                              class: "recent-time"
                            },
                            vue.toDisplayString($setup.formatTime(prize.drawnAt)),
                            1
                            /* TEXT */
                          )) : vue.createCommentVNode("v-if", true)
                        ])
                      ])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )),
      vue.createCommentVNode(" Result Overlay "),
      $setup.showResult && $setup.lastPrize ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "result-overlay",
        onClick: $setup.closeResult
      }, [
        vue.createElementVNode("view", {
          class: "result-card",
          onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", {
            class: "result-orb",
            onClick: vue.withModifiers($setup.previewPrizeImage, ["stop"])
          }, [
            $setup.lastPrize.image ? (vue.openBlock(), vue.createElementBlock("image", {
              key: 0,
              src: $setup.lastPrize.image,
              mode: "aspectFill",
              class: "result-img"
            }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 1,
                class: "result-emoji"
              },
              vue.toDisplayString($setup.lastPrize.emoji || "🎁"),
              1
              /* TEXT */
            ))
          ]),
          vue.createElementVNode(
            "text",
            {
              class: vue.normalizeClass(["result-rarity-badge", $setup.rarityClass($setup.lastPrize.rarity)])
            },
            vue.toDisplayString($setup.RARITY_LABELS[$setup.lastPrize.rarity] || $setup.lastPrize.rarity),
            3
            /* TEXT, CLASS */
          ),
          vue.createElementVNode(
            "text",
            { class: "result-name" },
            vue.toDisplayString($setup.lastPrize.name),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "result-hint" }, "点击任意处关闭")
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesGachaDrawIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-3a7d4be3"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/pages/gacha/draw/index.vue"]]);
  const STORAGE_KEY$1 = "gacha_activities";
  const _sfc_main$2 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const rarities = [
        { value: "LEGENDARY", label: "传说" },
        { value: "EPIC", label: "史诗" },
        { value: "COMMON", label: "普通" }
      ];
      const name = vue.ref("");
      const coverImage = vue.ref("");
      const editId = vue.ref("");
      const prizes = vue.ref([
        { name: "", image: "", rarity: "COMMON" },
        { name: "", image: "", rarity: "COMMON" }
      ]);
      function genId() {
        return (/* @__PURE__ */ new Date()).getTime().toString(36) + Math.random().toString(36).substr(2, 6);
      }
      function addPrize() {
        prizes.value.push({ name: "", image: "", rarity: "COMMON" });
      }
      function removePrize(idx) {
        prizes.value.splice(idx, 1);
      }
      function uploadCover() {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          success: (res) => {
            uni.saveFile({
              tempFilePath: res.tempFilePaths[0],
              success: (saveRes) => {
                coverImage.value = saveRes.savedFilePath;
              },
              fail: () => {
                coverImage.value = res.tempFilePaths[0];
              }
            });
          }
        });
      }
      function uploadPrizeImage(idx) {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          success: (res) => {
            uni.saveFile({
              tempFilePath: res.tempFilePaths[0],
              success: (saveRes) => {
                prizes.value[idx].image = saveRes.savedFilePath;
              },
              fail: () => {
                prizes.value[idx].image = res.tempFilePaths[0];
              }
            });
          }
        });
      }
      function doSave() {
        const n = name.value.trim();
        if (!n) {
          uni.showToast({ title: "请输入活动名称", icon: "none" });
          return;
        }
        const validPrizes = prizes.value.filter((p) => p.name.trim());
        if (validPrizes.length < 2) {
          uni.showToast({ title: "请至少填写 2 个奖品名称", icon: "none" });
          return;
        }
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$1);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          const activities = Array.isArray(parsed) ? parsed : [];
          if (editId.value) {
            const idx = activities.findIndex((a) => a.id === editId.value);
            if (idx > -1) {
              activities[idx].name = n;
              activities[idx].coverImage = coverImage.value;
              activities[idx].coverGradient = "";
              activities[idx].emoji = "";
              activities[idx].prizes = validPrizes.map((p) => ({
                id: p.id || genId(),
                name: p.name.trim(),
                rarity: p.rarity,
                image: p.image
              }));
            }
          } else {
            activities.push({
              id: genId(),
              name: n,
              description: "精彩抽卡活动",
              coverImage: coverImage.value,
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              prizes: validPrizes.map((p) => ({
                id: genId(),
                name: p.name.trim(),
                rarity: p.rarity,
                image: p.image
              })),
              drawnPrizeIds: []
            });
          }
          uni.setStorageSync(STORAGE_KEY$1, JSON.stringify(activities));
          uni.showToast({ title: editId.value ? "已保存" : "创建成功", icon: "success" });
          setTimeout(() => {
            uni.navigateBack();
          }, 800);
        } catch (e) {
          uni.showToast({ title: "保存失败", icon: "none" });
        }
      }
      function goBack() {
        uni.navigateBack();
      }
      onLoad((options) => {
        if (options && options.editId) {
          editId.value = options.editId;
          try {
            const raw = uni.getStorageSync(STORAGE_KEY$1);
            const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
            const activities = Array.isArray(parsed) ? parsed : [];
            const act = activities.find((a) => a.id === options.editId);
            if (act) {
              name.value = act.name;
              coverImage.value = act.coverImage || "";
              prizes.value = (act.prizes || []).map((p) => ({
                id: p.id,
                name: p.name,
                image: p.image || "",
                rarity: p.rarity || "COMMON"
              }));
              if (prizes.value.length < 2) {
                prizes.value.push({ name: "", image: "", rarity: "COMMON" });
              }
            }
          } catch (e) {
          }
        }
      });
      const __returned__ = { STORAGE_KEY: STORAGE_KEY$1, rarities, name, coverImage, editId, prizes, genId, addPrize, removePrize, uploadCover, uploadPrizeImage, doSave, goBack, ref: vue.ref, get onLoad() {
        return onLoad;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" Header "),
      vue.createElementVNode("view", { class: "gacha-header" }, [
        vue.createElementVNode("view", { class: "header-left" }, [
          vue.createElementVNode("text", {
            class: "back-btn",
            onClick: $setup.goBack
          }, "←"),
          vue.createElementVNode(
            "text",
            { class: "header-title" },
            vue.toDisplayString($setup.editId ? "编辑活动" : "创建新活动"),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" Form "),
      vue.createElementVNode("view", { class: "form-body" }, [
        vue.createCommentVNode(" Activity Cover "),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("text", { class: "section-label" }, "活动封面"),
          vue.createElementVNode("view", {
            class: "cover-upload",
            onClick: $setup.uploadCover
          }, [
            $setup.coverImage ? (vue.openBlock(), vue.createElementBlock("image", {
              key: 0,
              src: $setup.coverImage,
              mode: "aspectFill",
              class: "cover-preview"
            }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "cover-placeholder"
            }, [
              vue.createElementVNode("text", { class: "cover-icon-big" }, "📷"),
              vue.createElementVNode("text", { class: "cover-hint" }, "点击上传封面图")
            ]))
          ])
        ]),
        vue.createCommentVNode(" Activity Info "),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("text", { class: "section-label" }, "活动信息"),
          vue.createElementVNode("view", { class: "form-card" }, [
            vue.createElementVNode("text", { class: "field-label" }, [
              vue.createElementVNode("text", { class: "label-icon" }, "🎯"),
              vue.createTextVNode("活动名称")
            ]),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "field-input",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.name = $event),
                placeholder: "输入响亮的活动标题...",
                "placeholder-style": "color:#a0a0a0"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.name]
            ])
          ])
        ]),
        vue.createCommentVNode(" Prizes "),
        vue.createElementVNode("view", { class: "section" }, [
          vue.createElementVNode("text", { class: "section-label" }, "奖品列表"),
          vue.createElementVNode("view", { class: "prize-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.prizes, (prize, idx) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "prize-item",
                  key: idx
                }, [
                  vue.createElementVNode("view", {
                    class: "prize-img-box",
                    onClick: ($event) => $setup.uploadPrizeImage(idx)
                  }, [
                    prize.image ? (vue.openBlock(), vue.createElementBlock("image", {
                      key: 0,
                      src: prize.image,
                      mode: "aspectFill",
                      class: "prize-img"
                    }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock("view", {
                      key: 1,
                      class: "prize-img-placeholder"
                    }, [
                      vue.createElementVNode("text", { class: "prize-img-add" }, "+"),
                      vue.createElementVNode("text", { class: "prize-img-hint" }, "图片")
                    ]))
                  ], 8, ["onClick"]),
                  vue.createElementVNode("view", { class: "prize-body" }, [
                    vue.withDirectives(vue.createElementVNode("input", {
                      class: "field-input",
                      "onUpdate:modelValue": ($event) => prize.name = $event,
                      placeholder: "例如：限量款潮玩",
                      "placeholder-style": "color:#a0a0a0"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [vue.vModelText, prize.name]
                    ]),
                    vue.createElementVNode("view", { class: "rarity-row" }, [
                      (vue.openBlock(), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList($setup.rarities, (r) => {
                          return vue.createElementVNode("text", {
                            key: r.value,
                            class: vue.normalizeClass([
                              "rarity-chip",
                              prize.rarity === r.value ? "active" : "",
                              "rarity-" + r.value.toLowerCase()
                            ]),
                            onClick: ($event) => prize.rarity = r.value
                          }, vue.toDisplayString(r.label), 11, ["onClick"]);
                        }),
                        64
                        /* STABLE_FRAGMENT */
                      ))
                    ])
                  ]),
                  $setup.prizes.length > 1 ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "prize-remove",
                    onClick: ($event) => $setup.removePrize(idx)
                  }, [
                    vue.createElementVNode("text", null, "✕")
                  ], 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", {
            class: "add-prize-btn",
            onClick: $setup.addPrize
          }, [
            vue.createElementVNode("text", { class: "add-icon" }, "+"),
            vue.createElementVNode("text", null, "添加更多奖品")
          ])
        ]),
        vue.createCommentVNode(" Tips "),
        vue.createElementVNode("view", { class: "tips-card" }, [
          vue.createElementVNode("text", { class: "tips-icon" }, "💡"),
          vue.createElementVNode("view", { class: "tips-body" }, [
            vue.createElementVNode("text", { class: "tips-title" }, "贴士"),
            vue.createElementVNode("text", { class: "tips-text" }, "为每个奖品上传一张精美的实拍图，可以极大地提高用户的参与热情。")
          ])
        ])
      ]),
      vue.createCommentVNode(" Save Button "),
      vue.createElementVNode("view", { class: "save-bar" }, [
        vue.createElementVNode("view", {
          class: "save-btn",
          onClick: $setup.doSave
        }, [
          vue.createElementVNode(
            "text",
            { class: "save-btn-text" },
            vue.toDisplayString($setup.editId ? "保存修改" : "完成并保存"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "save-btn-check" }, "✓")
        ])
      ])
    ]);
  }
  const PagesGachaCreateIndex = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-e1b0d72e"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/pages/gacha/create/index.vue"]]);
  const STORAGE_KEY = "gacha_activities";
  const _sfc_main$1 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const activities = vue.ref([]);
      function getDrawnPrizeIds(arr) {
        return (arr || []).map(
          (item) => typeof item === "string" ? item : item.prizeId
        );
      }
      function formatTime(iso) {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}`;
      }
      const RARITY_LABELS = {
        LEGENDARY: "传说",
        EPIC: "史诗",
        RARE: "稀有",
        COMMON: "普通"
      };
      const drawnItems = vue.computed(() => {
        const items = [];
        activities.value.forEach((act) => {
          const drawnRecords = act.drawnPrizeIds || [];
          const drawnIds = getDrawnPrizeIds(drawnRecords);
          const idToRecord = {};
          drawnRecords.forEach((r) => {
            idToRecord[typeof r === "string" ? r : r.prizeId] = typeof r === "string" ? null : r;
          });
          act.prizes.forEach((p) => {
            if (drawnIds.includes(p.id)) {
              const record = idToRecord[p.id];
              items.push({
                prizeId: p.id,
                activityId: act.id,
                activityName: act.name,
                name: p.name,
                emoji: p.emoji,
                image: p.image,
                rarity: p.rarity,
                rarityLabel: RARITY_LABELS[p.rarity] || p.rarity,
                drawnAt: record ? record.drawnAt : null
              });
            }
          });
        });
        return items;
      });
      function loadActivities() {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          activities.value = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          activities.value = [];
        }
      }
      function doRestore(item) {
        const act = activities.value.find((a) => a.id === item.activityId);
        if (!act)
          return;
        const drawnRecords = act.drawnPrizeIds || [];
        const idx = drawnRecords.findIndex(
          (r) => (typeof r === "string" ? r : r.prizeId) === item.prizeId
        );
        if (idx > -1) {
          act.drawnPrizeIds.splice(idx, 1);
          uni.setStorageSync(STORAGE_KEY, JSON.stringify(activities.value));
          uni.showToast({ title: "已恢复到奖池", icon: "success" });
        }
      }
      function goBack() {
        uni.navigateBack();
      }
      onShow(() => {
        loadActivities();
      });
      const __returned__ = { STORAGE_KEY, activities, getDrawnPrizeIds, formatTime, RARITY_LABELS, drawnItems, loadActivities, doRestore, goBack, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      }, GachaNav };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" Header "),
      vue.createElementVNode("view", { class: "gacha-header" }, [
        vue.createElementVNode("view", { class: "header-left" }, [
          vue.createElementVNode("text", {
            class: "back-btn",
            onClick: $setup.goBack
          }, "←"),
          vue.createElementVNode("text", { class: "header-title" }, "已抽取内容")
        ]),
        vue.createElementVNode("view", { class: "header-right" }, [
          vue.createElementVNode(
            "text",
            { class: "count-badge" },
            "共 " + vue.toDisplayString($setup.drawnItems.length) + " 件",
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" Empty State "),
      $setup.drawnItems.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "empty-state"
      }, [
        vue.createElementVNode("text", { class: "empty-icon" }, "📭"),
        vue.createElementVNode("text", { class: "empty-text" }, "还没有抽中的奖品"),
        vue.createElementVNode("text", { class: "empty-hint" }, "去抽卡页面试试手气吧")
      ])) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          vue.createCommentVNode(" Drawn Items List "),
          vue.createElementVNode("view", { class: "history-list" }, [
            vue.createElementVNode("view", { class: "list-header" }, [
              vue.createElementVNode("text", { class: "list-title" }, "全部抽中记录")
            ]),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.drawnItems, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "item",
                  key: item.prizeId + item.activityId
                }, [
                  vue.createElementVNode("view", { class: "item-left" }, [
                    vue.createElementVNode("view", { class: "item-icon" }, [
                      item.image ? (vue.openBlock(), vue.createElementBlock("image", {
                        key: 0,
                        src: item.image,
                        mode: "aspectFill",
                        class: "item-img"
                      }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock(
                        "text",
                        { key: 1 },
                        vue.toDisplayString(item.emoji || "🎁"),
                        1
                        /* TEXT */
                      ))
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "item-body" }, [
                    vue.createElementVNode("view", { class: "item-top" }, [
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["rarity-badge", "rarity-" + item.rarity.toLowerCase()])
                        },
                        vue.toDisplayString(item.rarityLabel),
                        3
                        /* TEXT, CLASS */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "item-source" },
                        vue.toDisplayString(item.activityName),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "item-name" },
                      vue.toDisplayString(item.name),
                      1
                      /* TEXT */
                    ),
                    item.drawnAt ? (vue.openBlock(), vue.createElementBlock(
                      "text",
                      {
                        key: 0,
                        class: "item-time"
                      },
                      vue.toDisplayString($setup.formatTime(item.drawnAt)),
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "item-right" }, [
                    vue.createElementVNode("view", {
                      class: "restore-btn",
                      onClick: ($event) => $setup.doRestore(item)
                    }, [
                      vue.createElementVNode("text", null, "恢复到奖池")
                    ], 8, ["onClick"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ],
        2112
        /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
      )),
      vue.createVNode($setup["GachaNav"], { active: "history" })
    ]);
  }
  const PagesGachaHistoryIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-9f35b6f8"], ["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/pages/gacha/history/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/add/index", PagesAddIndex);
  __definePage("pages/gacha/list/index", PagesGachaListIndex);
  __definePage("pages/gacha/draw/index", PagesGachaDrawIndex);
  __definePage("pages/gacha/create/index", PagesGachaCreateIndex);
  __definePage("pages/gacha/history/index", PagesGachaHistoryIndex);
  const _sfc_main = {};
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/mygitee/00/记账本APP/bookkeeping-app/app/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
