/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

var gDebuggee;
var gClient;
var gThreadClient;

function run_test()
{
  initTestDebuggerServer();
  gDebuggee = addTestGlobal("test-stack");
  gClient = new DebuggerClient(DebuggerServer.connectPipe());
  gClient.connect(function() {
    attachTestTabAndResume(gClient, "test-stack", function(aResponse, aTabClient, aThreadClient) {
      gThreadClient = aThreadClient;
      test_pause_frame();
    });
  });
  do_test_pending();
}

function test_pause_frame()
{
  gThreadClient.addOneTimeListener("paused", function(aEvent, aPacket) {
    gThreadClient.addOneTimeListener("framesadded", function() {
      do_check_eq(gThreadClient.cachedFrames.length, 3);
      do_check_true(gThreadClient.moreFrames);
      do_check_false(gThreadClient.fillFrames(3));

      do_check_true(gThreadClient.fillFrames(30));
      gThreadClient.addOneTimeListener("framesadded", function() {
        do_check_false(gThreadClient.moreFrames);
        do_check_eq(gThreadClient.cachedFrames.length, 7);
        gThreadClient.resume(function() {
          finishClient(gClient);
        });
      });
    });
    do_check_true(gThreadClient.fillFrames(3));
  });

  gDebuggee.eval("(" + function() {
    var recurseLeft = 5;
    function recurse() {
      if (--recurseLeft == 0) {
        debugger;
        return;
      }
      recurse();
    };
    recurse();
    ")"
  } + ")()");
}
