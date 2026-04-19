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
  const STORAGE_KEY$1 = "asset_snapshots";
  const _sfc_main$3 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const rawSnapshots = vue.ref([]);
      function loadSnapshots() {
        try {
          const raw = uni.getStorageSync(STORAGE_KEY$1);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          rawSnapshots.value = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          rawSnapshots.value = [];
        }
      }
      onShow(loadSnapshots);
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
          uni.setStorageSync(STORAGE_KEY$1, JSON.stringify(rawSnapshots.value));
          uni.showToast({ title: "已删除", icon: "success" });
        }
        closeDelete();
      }
      function goAdd() {
        uni.navigateTo({ url: "/pages/add/index" });
      }
      const __returned__ = { STORAGE_KEY: STORAGE_KEY$1, rawSnapshots, loadSnapshots, computedSnapshots, groupedSnapshots, formatNum, formatNumCN, currentYear, weekdays, formatDate, previewImage, deleteDialog, confirmDelete, closeDelete, doDelete, goAdd, ref: vue.ref, computed: vue.computed, get onShow() {
        return onShow;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createCommentVNode(" APP BAR "),
      vue.createElementVNode("view", { class: "app-bar" }, [
        vue.createElementVNode("text", { class: "app-logo" }, "时迹"),
        vue.createElementVNode("text", { class: "app-tagline" }, "ShiJi")
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
      $setup.computedSnapshots.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "timeline"
      }, [
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
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" FAB "),
      vue.createElementVNode("view", {
        class: "fab",
        onClick: $setup.goAdd
      }, [
        vue.createElementVNode("text", { class: "fab-icon" }, "+")
      ]),
      vue.createCommentVNode(" DELETE DIALOG "),
      $setup.deleteDialog.show ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "dialog-overlay",
        onClick: $setup.closeDelete
      }, [
        vue.createElementVNode("view", {
          class: "dialog-card",
          onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
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
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-1cf27b2a"], ["__file", "E:/A0MyCodes/记账本App/app/pages/index/index.vue"]]);
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
  const _sfc_main$2 = {
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
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
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
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-d31e1c47"], ["__file", "E:/A0MyCodes/记账本App/app/uni_modules/uni-icons/components/uni-icons/uni-icons.vue"]]);
  const STORAGE_KEY = "asset_snapshots";
  const _sfc_main$1 = {
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
      const platforms = vue.ref([
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
      ]);
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
          const raw = uni.getStorageSync(STORAGE_KEY);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.sort((a, b) => b.date.localeCompare(a.date));
            lastTotal.value = (parsed[0].platforms || []).reduce(
              (s, p) => s + (parseFloat(p.amount) || 0),
              0
            );
          }
        } catch (e) {
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
          count: 5 - screenshots.value.length,
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
          const raw = uni.getStorageSync(STORAGE_KEY);
          const parsed = raw && typeof raw === "string" ? JSON.parse(raw) : raw;
          const arr = Array.isArray(parsed) ? parsed : [];
          arr.push(snapshot);
          const dataStr = JSON.stringify(arr);
          uni.setStorage({
            key: STORAGE_KEY,
            data: dataStr,
            success: function() {
              uni.showToast({ title: "已保存", icon: "success" });
              setTimeout(function() {
                uni.navigateBack();
              }, 800);
            },
            fail: function(err) {
              formatAppLog("error", "at pages/add/index.vue:435", "保存失败:", err);
              uni.showToast({
                title: "保存失败: " + (err.errMsg || "存储空间不足"),
                icon: "none",
                duration: 3e3
              });
            }
          });
        } catch (e) {
          formatAppLog("error", "at pages/add/index.vue:444", "保存异常:", e);
          uni.showToast({
            title: "保存失败: " + (e.message || "未知错误"),
            icon: "none",
            duration: 3e3
          });
        }
      }
      const __returned__ = { STORAGE_KEY, defaultPlatforms, weekdays, today, formDate, get platformIdCounter() {
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
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
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
  const PagesAddIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-89f6901d"], ["__file", "E:/A0MyCodes/记账本App/app/pages/add/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/add/index", PagesAddIndex);
  const _sfc_main = {};
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "E:/A0MyCodes/记账本App/app/App.vue"]]);
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
