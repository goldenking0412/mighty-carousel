(function($,window,document,undefined){$.attrFn=$.attrFn||{};var dataPropertyName="virtualMouseBindings",touchTargetPropertyName="virtualTouchID",virtualEventNames="vmouseover vmousedown vmousemove vmouseup vclick vmouseout vmousecancel".split(" "),touchEventProps="clientX clientY pageX pageY screenX screenY".split(" "),mouseHookProps=$.event.mouseHooks?$.event.mouseHooks.props:[],mouseEventProps=$.event.props.concat(mouseHookProps),activeDocHandlers={},resetTimerID=0,startX=0,startY=0,didScroll=false,clickBlockList=[],blockMouseTriggers=false,blockTouchTriggers=false,eventCaptureSupported="addEventListener"in document,$document=$(document),nextTouchID=1,lastTouchID=0;$.vmouse={moveDistanceThreshold:10,clickDistanceThreshold:10,resetTimerDuration:1500};function getNativeEvent(event){while(event&&typeof event.originalEvent!=="undefined"){event=event.originalEvent;}
return event;}
function createVirtualEvent(event,eventType){var t=event.type,oe,props,ne,prop,ct,touch,i,j;event=$.Event(event);event.type=eventType;oe=event.originalEvent;props=$.event.props;if(t.search(/^(mouse|click)/)>-1){props=mouseEventProps;}
if(oe){for(i=props.length,prop;i;){prop=props[--i];event[prop]=oe[prop];}}
if(t.search(/mouse(down|up)|click/)>-1&&!event.which){event.which=1;}
if(t.search(/^touch/)!==-1){ne=getNativeEvent(oe);t=ne.touches;ct=ne.changedTouches;touch=(t&&t.length)?t[0]:((ct&&ct.length)?ct[0]:undefined);if(touch){for(j=0,len=touchEventProps.length;j<len;j++){prop=touchEventProps[j];event[prop]=touch[prop];}}}
return event;}
function getVirtualBindingFlags(element){var flags={},b,k;while(element){b=$.data(element,dataPropertyName);for(k in b){if(b[k]){flags[k]=flags.hasVirtualBinding=true;}}
element=element.parentNode;}
return flags;}
function getClosestElementWithVirtualBinding(element,eventType){var b;while(element){b=$.data(element,dataPropertyName);if(b&&(!eventType||b[eventType])){return element;}
element=element.parentNode;}
return null;}
function enableTouchBindings(){blockTouchTriggers=false;}
function disableTouchBindings(){blockTouchTriggers=true;}
function enableMouseBindings(){lastTouchID=0;clickBlockList.length=0;blockMouseTriggers=false;disableTouchBindings();}
function disableMouseBindings(){enableTouchBindings();}
function startResetTimer(){clearResetTimer();resetTimerID=setTimeout(function(){resetTimerID=0;enableMouseBindings();},$.vmouse.resetTimerDuration);}
function clearResetTimer(){if(resetTimerID){clearTimeout(resetTimerID);resetTimerID=0;}}
function triggerVirtualEvent(eventType,event,flags){var ve;if((flags&&flags[eventType])||(!flags&&getClosestElementWithVirtualBinding(event.target,eventType))){ve=createVirtualEvent(event,eventType);$(event.target).trigger(ve);}
return ve;}
function mouseEventCallback(event){var touchID=$.data(event.target,touchTargetPropertyName);if(!blockMouseTriggers&&(!lastTouchID||lastTouchID!==touchID)){var ve=triggerVirtualEvent("v"+event.type,event);if(ve){if(ve.isDefaultPrevented()){event.preventDefault();}
if(ve.isPropagationStopped()){event.stopPropagation();}
if(ve.isImmediatePropagationStopped()){event.stopImmediatePropagation();}}}}
function handleTouchStart(event){var touches=getNativeEvent(event).touches,target,flags;if(touches&&touches.length===1){target=event.target;flags=getVirtualBindingFlags(target);if(flags.hasVirtualBinding){lastTouchID=nextTouchID++;$.data(target,touchTargetPropertyName,lastTouchID);clearResetTimer();disableMouseBindings();didScroll=false;var t=getNativeEvent(event).touches[0];startX=t.pageX;startY=t.pageY;triggerVirtualEvent("vmouseover",event,flags);triggerVirtualEvent("vmousedown",event,flags);}}}
function handleScroll(event){if(blockTouchTriggers){return;}
if(!didScroll){triggerVirtualEvent("vmousecancel",event,getVirtualBindingFlags(event.target));}
didScroll=true;startResetTimer();}
function handleTouchMove(event){if(blockTouchTriggers){return;}
var t=getNativeEvent(event).touches[0],didCancel=didScroll,moveThreshold=$.vmouse.moveDistanceThreshold;didScroll=didScroll||(Math.abs(t.pageX-startX)>moveThreshold||Math.abs(t.pageY-startY)>moveThreshold),flags=getVirtualBindingFlags(event.target);if(didScroll&&!didCancel){triggerVirtualEvent("vmousecancel",event,flags);}
triggerVirtualEvent("vmousemove",event,flags);startResetTimer();}
function handleTouchEnd(event){if(blockTouchTriggers){return;}
disableTouchBindings();var flags=getVirtualBindingFlags(event.target),t;triggerVirtualEvent("vmouseup",event,flags);if(!didScroll){var ve=triggerVirtualEvent("vclick",event,flags);if(ve&&ve.isDefaultPrevented()){t=getNativeEvent(event).changedTouches[0];clickBlockList.push({touchID:lastTouchID,x:t.clientX,y:t.clientY});blockMouseTriggers=true;}}
triggerVirtualEvent("vmouseout",event,flags);didScroll=false;startResetTimer();}
function hasVirtualBindings(ele){var bindings=$.data(ele,dataPropertyName),k;if(bindings){for(k in bindings){if(bindings[k]){return true;}}}
return false;}
function dummyMouseHandler(){};function getSpecialEventObject(eventType){var realType=eventType.substr(1);return{setup:function(data,namespace){if(!hasVirtualBindings(this)){$.data(this,dataPropertyName,{});}
var bindings=$.data(this,dataPropertyName);bindings[eventType]=true;activeDocHandlers[eventType]=(activeDocHandlers[eventType]||0)+1;if(activeDocHandlers[eventType]===1){$document.bind(realType,mouseEventCallback);}
$(this).bind(realType,dummyMouseHandler);if(eventCaptureSupported){activeDocHandlers["touchstart"]=(activeDocHandlers["touchstart"]||0)+1;if(activeDocHandlers["touchstart"]===1){$document.bind("touchstart",handleTouchStart).bind("touchend",handleTouchEnd).bind("touchmove",handleTouchMove).bind("scroll",handleScroll);}}},teardown:function(data,namespace){--activeDocHandlers[eventType];if(!activeDocHandlers[eventType]){$document.unbind(realType,mouseEventCallback);}
if(eventCaptureSupported){--activeDocHandlers["touchstart"];if(!activeDocHandlers["touchstart"]){$document.unbind("touchstart",handleTouchStart).unbind("touchmove",handleTouchMove).unbind("touchend",handleTouchEnd).unbind("scroll",handleScroll);}}
var $this=$(this),bindings=$.data(this,dataPropertyName);if(bindings){bindings[eventType]=false;}
$this.unbind(realType,dummyMouseHandler);if(!hasVirtualBindings(this)){$this.removeData(dataPropertyName);}}};}
for(var i=0;i<virtualEventNames.length;i++){$.event.special[virtualEventNames[i]]=getSpecialEventObject(virtualEventNames[i]);}
if(eventCaptureSupported){document.addEventListener("click",function(e){var cnt=clickBlockList.length,target=e.target,x,y,ele,i,o,touchID;if(cnt){x=e.clientX;y=e.clientY;threshold=$.vmouse.clickDistanceThreshold;ele=target;while(ele){for(i=0;i<cnt;i++){o=clickBlockList[i];touchID=0;if((ele===target&&Math.abs(o.x-x)<threshold&&Math.abs(o.y-y)<threshold)||$.data(ele,touchTargetPropertyName)===o.touchID){e.preventDefault();e.stopPropagation();return;}}
ele=ele.parentNode;}}},true);}})(jQuery,window,document);(function($,window,undefined){$.each(("touchstart touchmove touchend tap taphold swipe swipeleft swiperight").split(""),function(i,name){$.fn[name]=function(fn){return fn?this.bind(name,fn):this.trigger(name);};$.attrFn[name]=true;});function triggerCustomEvent(obj,eventType,event){var originalType=event.type;event.type=eventType;$.event.dispatch.call(obj,event);event.type=originalType;}
$.event.special.tap={setup:function(){var thisObject=this,$this=$(thisObject);$this.bind("touchstart",function(event){if(event.which&&event.which!==1){return false;}
var origTarget=event.target,origEvent=event.originalEvent,timer;function clearTapTimer(){clearTimeout(timer);}
function clearTapHandlers(){clearTapTimer();$this.unbind("vclick",clickHandler).unbind("vmouseup",clearTapTimer);$(document).unbind("vmousecancel",clearTapHandlers);}
function clickHandler(event){clearTapHandlers();if(origTarget==event.target){triggerCustomEvent(thisObject,"tap",event);}}
$this.bind("vmouseup",clearTapTimer).bind("vclick",clickHandler);$(document).bind("vmousecancel",clearTapHandlers);timer=setTimeout(function(){triggerCustomEvent(thisObject,"taphold",$.Event("taphold",{target:origTarget}));},750);});}};$.event.special.swipe={scrollSupressionThreshold:10,durationThreshold:1000,horizontalDistanceThreshold:30,verticalDistanceThreshold:75,setup:function(){var thisObject=this,$this=$(thisObject);$this.bind("touchstart",function(event){var data=event.originalEvent.touches?event.originalEvent.touches[0]:event,start={time:(new Date()).getTime(),coords:[data.pageX,data.pageY],origin:$(event.target)},stop;function moveHandler(event){if(!start){return;}
var data=event.originalEvent.touches?event.originalEvent.touches[0]:event;stop={time:(new Date()).getTime(),coords:[data.pageX,data.pageY]};if(Math.abs(start.coords[0]-stop.coords[0])>$.event.special.swipe.scrollSupressionThreshold){event.preventDefault();}}
$this.bind("touchmove",moveHandler).one("touchend",function(event){$this.unbind("touchmove",moveHandler);if(start&&stop){if(stop.time-start.time<$.event.special.swipe.durationThreshold&&Math.abs(start.coords[0]-stop.coords[0])>$.event.special.swipe.horizontalDistanceThreshold&&Math.abs(start.coords[1]-stop.coords[1])<$.event.special.swipe.verticalDistanceThreshold){start.origin.trigger("swipe").trigger(start.coords[0]>stop.coords[0]?"swipeleft":"swiperight");}}
start=stop=undefined;});});}};$.each({taphold:"tap",swipeleft:"swipe",swiperight:"swipe"},function(event,sourceEvent){$.event.special[event]={setup:function(){$(this).bind(sourceEvent,$.noop);}};});})(jQuery,this);